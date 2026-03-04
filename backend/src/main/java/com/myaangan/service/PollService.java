package com.myaangan.service;

import com.myaangan.dto.PollRequest;
import com.myaangan.dto.PollResponse;
import com.myaangan.dto.PollVoteRequest;
import com.myaangan.entity.*;
import com.myaangan.enums.PollStatus;
import com.myaangan.enums.PollType;
import com.myaangan.enums.ResultVisibility;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PollService {

    private final PollRepository       pollRepo;
    private final PollVoteRepository   voteRepo;
    private final PollCommentRepository commentRepo;
    private final UserRepository       userRepo;

    // ── Create ────────────────────────────────────────────────────────────────
    public PollResponse create(PollRequest req, String creatorEmail) {
        User creator = findUser(creatorEmail);

        Poll poll = Poll.builder()
            .question(req.getQuestion())
            .description(req.getDescription())
            .type(req.getType())
            .status(PollStatus.DRAFT)
            .resultVisibility(req.getResultVisibility() != null ? req.getResultVisibility() : ResultVisibility.AFTER_VOTE)
            .startsAt(req.getStartsAt())
            .endsAt(req.getEndsAt())
            .anonymous(req.isAnonymous())
            .allowVoteChange(req.isAllowVoteChange())
            .allowComments(req.isAllowComments())
            .maxChoices(req.getMaxChoices())
            .targetBlocks(req.getTargetBlocks())
            .createdBy(creator)
            .build();

        // Options (for choice-based polls)
        if (req.getOptions() != null && !req.getOptions().isEmpty()) {
            for (int i = 0; i < req.getOptions().size(); i++) {
                PollRequest.OptionRequest or = req.getOptions().get(i);
                PollOption opt = PollOption.builder()
                    .poll(poll)
                    .text(or.getText())
                    .emoji(or.getEmoji())
                    .displayOrder(or.getDisplayOrder() > 0 ? or.getDisplayOrder() : i)
                    .build();
                poll.getOptions().add(opt);
            }
        }

        // If startsAt is in the past or null and poll should auto-activate — keep as DRAFT
        // Admin publishes manually or scheduler picks it up
        pollRepo.save(poll);
        log.info("Poll #{} created by {}", poll.getId(), creatorEmail);
        return toResponse(poll, creatorEmail, true);
    }

    // ── Publish (DRAFT → ACTIVE) ──────────────────────────────────────────────
    public PollResponse publish(Long pollId, String email) {
        Poll poll = findPoll(pollId);
        assertCanManage(poll, email);
        if (poll.getStatus() != PollStatus.DRAFT)
            throw new IllegalStateException("Only DRAFT polls can be published");
        poll.setStatus(PollStatus.ACTIVE);
        poll.setPublishedAt(LocalDateTime.now());
        return toResponse(pollRepo.save(poll), email, true);
    }

    // ── Close (ACTIVE → CLOSED) ───────────────────────────────────────────────
    public PollResponse close(Long pollId, String email) {
        Poll poll = findPoll(pollId);
        assertCanManage(poll, email);
        if (poll.getStatus() != PollStatus.ACTIVE)
            throw new IllegalStateException("Only ACTIVE polls can be closed");
        poll.setStatus(PollStatus.CLOSED);
        poll.setClosedAt(LocalDateTime.now());
        return toResponse(pollRepo.save(poll), email, true);
    }

    // ── Archive ───────────────────────────────────────────────────────────────
    public PollResponse archive(Long pollId, String email) {
        Poll poll = findPoll(pollId);
        assertCanManage(poll, email);
        poll.setStatus(PollStatus.ARCHIVED);
        return toResponse(pollRepo.save(poll), email, true);
    }

    // ── Update (DRAFT only) ───────────────────────────────────────────────────
    public PollResponse update(Long pollId, PollRequest req, String email) {
        Poll poll = findPoll(pollId);
        assertCanManage(poll, email);
        if (poll.getStatus() != PollStatus.DRAFT)
            throw new IllegalStateException("Only DRAFT polls can be edited");

        poll.setQuestion(req.getQuestion());
        poll.setDescription(req.getDescription());
        poll.setType(req.getType());
        poll.setResultVisibility(req.getResultVisibility());
        poll.setStartsAt(req.getStartsAt());
        poll.setEndsAt(req.getEndsAt());
        poll.setAnonymous(req.isAnonymous());
        poll.setAllowVoteChange(req.isAllowVoteChange());
        poll.setAllowComments(req.isAllowComments());
        poll.setMaxChoices(req.getMaxChoices());
        poll.setTargetBlocks(req.getTargetBlocks());

        // Replace options
        poll.getOptions().clear();
        if (req.getOptions() != null) {
            for (int i = 0; i < req.getOptions().size(); i++) {
                PollRequest.OptionRequest or = req.getOptions().get(i);
                poll.getOptions().add(PollOption.builder()
                    .poll(poll).text(or.getText()).emoji(or.getEmoji())
                    .displayOrder(or.getDisplayOrder() > 0 ? or.getDisplayOrder() : i)
                    .build());
            }
        }
        return toResponse(pollRepo.save(poll), email, true);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public void delete(Long pollId, String email) {
        Poll poll = findPoll(pollId);
        assertCanManage(poll, email);
        if (poll.getStatus() == PollStatus.ACTIVE)
            throw new IllegalStateException("Close the poll before deleting");
        pollRepo.delete(poll);
    }

    // ── Cast vote ────────────────────────────────────────────────────────────
    public PollResponse vote(Long pollId, PollVoteRequest req, String voterEmail) {
        Poll poll = findPoll(pollId);
        User voter = findUser(voterEmail);

        if (poll.getStatus() != PollStatus.ACTIVE)
            throw new IllegalStateException("Voting is not open for this poll");
        if (poll.getEndsAt() != null && poll.getEndsAt().isBefore(LocalDateTime.now()))
            throw new IllegalStateException("Voting period has ended");

        boolean alreadyVoted = voteRepo.existsByPollIdAndVoterEmail(pollId, voterEmail);

        if (alreadyVoted) {
            if (!poll.isAllowVoteChange())
                throw new IllegalStateException("Vote changes are not allowed for this poll");
            // Delete existing votes before re-voting
            voteRepo.deleteByPollIdAndVoterEmail(pollId, voterEmail);
        }

        switch (poll.getType()) {
            case SINGLE_CHOICE -> {
                if (req.getOptionIds() == null || req.getOptionIds().size() != 1)
                    throw new IllegalArgumentException("Single choice: exactly one option required");
                castOptionVote(poll, voter, req.getOptionIds().get(0));
            }
            case MULTIPLE_CHOICE -> {
                if (req.getOptionIds() == null || req.getOptionIds().isEmpty())
                    throw new IllegalArgumentException("Multiple choice: at least one option required");
                int max = poll.getMaxChoices();
                if (max > 0 && req.getOptionIds().size() > max)
                    throw new IllegalArgumentException("Exceeds max choices: " + max);
                for (Long optId : req.getOptionIds()) castOptionVote(poll, voter, optId);
            }
            case YES_NO -> {
                if (!List.of("YES","NO","ABSTAIN").contains(req.getYesNoValue()))
                    throw new IllegalArgumentException("YES_NO: value must be YES, NO, or ABSTAIN");
                voteRepo.save(PollVote.builder().poll(poll).voter(voter)
                    .yesNoValue(req.getYesNoValue()).build());
            }
            case RATING -> {
                if (req.getRatingValue() == null || req.getRatingValue() < 1 || req.getRatingValue() > 5)
                    throw new IllegalArgumentException("Rating must be 1–5");
                voteRepo.save(PollVote.builder().poll(poll).voter(voter)
                    .ratingValue(req.getRatingValue()).build());
            }
        }
        log.info("Vote cast: poll #{} by {}", pollId, voterEmail);
        return toResponse(poll, voterEmail, false);
    }

    private void castOptionVote(Poll poll, User voter, Long optionId) {
        PollOption opt = poll.getOptions().stream()
            .filter(o -> o.getId().equals(optionId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Option not found: " + optionId));
        voteRepo.save(PollVote.builder().poll(poll).voter(voter).option(opt).build());
    }

    // ── Add comment ───────────────────────────────────────────────────────────
    public PollResponse.CommentResponse addComment(Long pollId, String text, String authorEmail) {
        Poll poll = findPoll(pollId);
        if (!poll.isAllowComments()) throw new IllegalStateException("Comments are disabled for this poll");
        if (poll.getStatus() == PollStatus.ARCHIVED) throw new IllegalStateException("Poll is archived");
        User author = findUser(authorEmail);
        PollComment comment = PollComment.builder().poll(poll).author(author).text(text).build();
        commentRepo.save(comment);
        return toCommentResponse(comment, authorEmail);
    }

    // ── Delete comment ────────────────────────────────────────────────────────
    public void deleteComment(Long commentId, String email) {
        PollComment comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        User user = findUser(email);
        boolean isOwner  = comment.getAuthor().getEmail().equals(email);
        boolean isAdmin  = user.getRole().name().equals("ADMIN");
        boolean isCreator = comment.getPoll().getCreatedBy().getEmail().equals(email);
        if (!isOwner && !isAdmin && !isCreator)
            throw new SecurityException("Not authorised to delete this comment");
        commentRepo.delete(comment);
    }

    // ── Queries ───────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PollResponse> getActivePolls(String viewerEmail) {
        return pollRepo.findActivePolls().stream()
            .map(p -> toResponse(p, viewerEmail, false))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PollResponse> getAllPolls(String viewerEmail) {
        return pollRepo.findByStatusInOrderByCreatedAtDesc(
            List.of(PollStatus.DRAFT, PollStatus.ACTIVE, PollStatus.CLOSED))
            .stream()
            .map(p -> toResponse(p, viewerEmail, true))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PollResponse getById(Long pollId, String viewerEmail) {
        Poll poll = findPoll(pollId);
        User viewer = findUser(viewerEmail);
        boolean isManager = canManage(poll, viewerEmail);
        return toResponse(poll, viewerEmail, isManager);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats(String email) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("active",  pollRepo.findByStatusOrderByCreatedAtDesc(PollStatus.ACTIVE).size());
        stats.put("draft",   pollRepo.findByStatusOrderByCreatedAtDesc(PollStatus.DRAFT).size());
        stats.put("closed",  pollRepo.findByStatusOrderByCreatedAtDesc(PollStatus.CLOSED).size());
        // Polls the user hasn't voted in yet
        long pendingVote = pollRepo.findActivePolls().stream()
            .filter(p -> !voteRepo.existsByPollIdAndVoterEmail(p.getId(), email))
            .count();
        stats.put("pendingVote", pendingVote);
        return stats;
    }

    // ── Scheduled: auto-publish and auto-close ────────────────────────────────
    @Scheduled(fixedDelay = 60_000) // every minute
    public void processScheduledPolls() {
        LocalDateTime now = LocalDateTime.now();

        pollRepo.findDraftsDueToStart(now).forEach(p -> {
            p.setStatus(PollStatus.ACTIVE);
            p.setPublishedAt(now);
            pollRepo.save(p);
            log.info("Auto-published poll #{}", p.getId());
        });

        pollRepo.findActiveDueToClose(now).forEach(p -> {
            p.setStatus(PollStatus.CLOSED);
            p.setClosedAt(now);
            pollRepo.save(p);
            log.info("Auto-closed poll #{}", p.getId());
        });
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private PollResponse toResponse(Poll poll, String viewerEmail, boolean includeFullResults) {
        List<PollVote> votes      = voteRepo.findByPollId(poll.getId());
        List<PollVote> myVotes    = voteRepo.findByPollIdAndVoterEmail(poll.getId(), viewerEmail);
        boolean hasVoted          = !myVotes.isEmpty();
        long totalVoters          = voteRepo.countDistinctVotersByPollId(poll.getId());
        long totalVotes           = votes.size();
        boolean isManager         = canManage(poll, viewerEmail);

        // Determine if results should be visible to this viewer
        boolean resultsVisible = switch (poll.getResultVisibility()) {
            case AFTER_VOTE  -> hasVoted || isManager || poll.getStatus() == PollStatus.CLOSED;
            case AFTER_CLOSE -> poll.getStatus() == PollStatus.CLOSED || isManager;
            case ADMIN_ONLY  -> isManager;
        };

        // Build option responses with vote counts (only if visible)
        List<PollResponse.OptionResponse> optionResponses = poll.getOptions().stream()
            .map(opt -> {
                long cnt = votes.stream().filter(v -> v.getOption() != null && v.getOption().getId().equals(opt.getId())).count();
                double pct = totalVotes > 0 ? (cnt * 100.0 / votes.stream().filter(v -> v.getOption() != null).count()) : 0;
                return PollResponse.OptionResponse.builder()
                    .id(opt.getId()).text(opt.getText()).emoji(opt.getEmoji())
                    .displayOrder(opt.getDisplayOrder())
                    .voteCount(resultsVisible ? cnt : -1)
                    .percentage(resultsVisible ? pct : -1)
                    .build();
            }).collect(Collectors.toList());

        // My vote info
        List<Long> myOptionIds = myVotes.stream()
            .filter(v -> v.getOption() != null).map(v -> v.getOption().getId()).collect(Collectors.toList());
        String myYesNo = myVotes.stream().filter(v -> v.getYesNoValue() != null)
            .map(PollVote::getYesNoValue).findFirst().orElse(null);
        Integer myRating = myVotes.stream().filter(v -> v.getRatingValue() != null)
            .map(PollVote::getRatingValue).findFirst().orElse(null);

        // Results block
        PollResponse.PollResults results = null;
        if (resultsVisible) {
            results = buildResults(poll, votes, isManager && includeFullResults && !poll.isAnonymous());
        }

        // Comments
        List<PollResponse.CommentResponse> comments = poll.getComments().stream()
            .map(c -> toCommentResponse(c, viewerEmail)).collect(Collectors.toList());

        // Seconds remaining
        Long secondsRemaining = null;
        if (poll.getEndsAt() != null && poll.getStatus() == PollStatus.ACTIVE) {
            long secs = ChronoUnit.SECONDS.between(LocalDateTime.now(), poll.getEndsAt());
            secondsRemaining = Math.max(0, secs);
        }

        return PollResponse.builder()
            .id(poll.getId())
            .question(poll.getQuestion())
            .description(poll.getDescription())
            .type(poll.getType())
            .status(poll.getStatus())
            .resultVisibility(poll.getResultVisibility())
            .startsAt(poll.getStartsAt())
            .endsAt(poll.getEndsAt())
            .closedAt(poll.getClosedAt())
            .publishedAt(poll.getPublishedAt())
            .createdAt(poll.getCreatedAt())
            .anonymous(poll.isAnonymous())
            .allowVoteChange(poll.isAllowVoteChange())
            .allowComments(poll.isAllowComments())
            .maxChoices(poll.getMaxChoices())
            .targetBlocks(poll.getTargetBlocks())
            .createdByName(poll.getCreatedBy().getFirstName() + " " + poll.getCreatedBy().getLastName())
            .createdByRole(poll.getCreatedBy().getRole().name())
            .options(optionResponses)
            .comments(comments)
            .totalVoters(totalVoters)
            .totalVotes(totalVotes)
            .hasVoted(hasVoted)
            .myOptionIds(myOptionIds)
            .myYesNoValue(myYesNo)
            .myRatingValue(myRating)
            .results(results)
            .resultsVisible(resultsVisible)
            .secondsRemaining(secondsRemaining)
            .build();
    }

    private PollResponse.PollResults buildResults(Poll poll, List<PollVote> votes, boolean includeVoters) {
        Map<Long, Long>   optCounts = new LinkedHashMap<>();
        Map<Long, Double> optPcts   = new LinkedHashMap<>();
        long optTotal = votes.stream().filter(v -> v.getOption() != null).count();

        for (PollOption opt : poll.getOptions()) {
            long cnt = votes.stream().filter(v -> v.getOption() != null && v.getOption().getId().equals(opt.getId())).count();
            optCounts.put(opt.getId(), cnt);
            optPcts.put(opt.getId(), optTotal > 0 ? cnt * 100.0 / optTotal : 0);
        }

        long yes = votes.stream().filter(v -> "YES".equals(v.getYesNoValue())).count();
        long no  = votes.stream().filter(v -> "NO".equals(v.getYesNoValue())).count();
        long abs = votes.stream().filter(v -> "ABSTAIN".equals(v.getYesNoValue())).count();

        OptionalDouble avg = votes.stream().filter(v -> v.getRatingValue() != null)
            .mapToInt(PollVote::getRatingValue).average();
        Map<Integer, Long> ratingDist = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            final int star = i;
            ratingDist.put(i, votes.stream().filter(v -> v.getRatingValue() != null && v.getRatingValue() == star).count());
        }

        List<PollResponse.VoterInfo> voterList = null;
        if (includeVoters) {
            // Group votes by voter for display
            Map<Long, List<PollVote>> byVoter = votes.stream().collect(Collectors.groupingBy(v -> v.getVoter().getId()));
            voterList = byVoter.values().stream().map(vList -> {
                User voter = vList.get(0).getVoter();
                String votedFor = vList.stream().map(v -> {
                    if (v.getOption()     != null) return v.getOption().getText();
                    if (v.getYesNoValue() != null) return v.getYesNoValue();
                    if (v.getRatingValue()!= null) return v.getRatingValue() + "★";
                    return "—";
                }).collect(Collectors.joining(", "));
                return PollResponse.VoterInfo.builder()
                    .name(voter.getFirstName() + " " + voter.getLastName())
                    .role(voter.getRole().name())
                    .flat(voter.getFlatNumber() != null ? (voter.getBlock() != null ? voter.getBlock()+"-" : "") + voter.getFlatNumber() : null)
                    .votedFor(votedFor)
                    .votedAt(vList.get(0).getCreatedAt())
                    .build();
            }).collect(Collectors.toList());
        }

        return PollResponse.PollResults.builder()
            .optionVoteCounts(optCounts)
            .optionPercentages(optPcts)
            .yesCount(yes).noCount(no).abstainCount(abs)
            .averageRating(avg.isPresent() ? avg.getAsDouble() : null)
            .ratingDistribution(ratingDist)
            .voters(voterList)
            .build();
    }

    private PollResponse.CommentResponse toCommentResponse(PollComment c, String viewerEmail) {
        return PollResponse.CommentResponse.builder()
            .id(c.getId())
            .authorName(c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName())
            .authorRole(c.getAuthor().getRole().name())
            .text(c.getText())
            .createdAt(c.getCreatedAt())
            .canDelete(c.getAuthor().getEmail().equals(viewerEmail))
            .build();
    }

    private boolean canManage(Poll poll, String email) {
        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null) return false;
        return user.getRole().name().equals("ADMIN") ||
               poll.getCreatedBy().getEmail().equals(email);
    }

    private void assertCanManage(Poll poll, String email) {
        if (!canManage(poll, email))
            throw new SecurityException("Not authorised to manage this poll");
    }

    private Poll findPoll(Long id) {
        return pollRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Poll not found: " + id));
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
