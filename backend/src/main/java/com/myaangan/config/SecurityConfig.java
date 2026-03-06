package com.myaangan.config;

import com.myaangan.security.JwtAuthFilter;
import com.myaangan.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).collect(Collectors.toList()));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Authenticated users
                .requestMatchers("/api/services/**").hasAnyRole(
                    "ADMIN","RESIDENT","SECURITY_GUARD","FACILITY_MANAGER",
                    "BUILDER_MANAGER","BDA_ENGINEER","PRESIDENT","SECRETARY","VOLUNTEER")
                .requestMatchers("/api/deliveries/**").hasAnyRole(
                    "ADMIN","RESIDENT","VOLUNTEER","SECURITY_GUARD","FACILITY_MANAGER")
                .requestMatchers("/api/vehicles/**")
                    .hasAnyRole("ADMIN","RESIDENT","VOLUNTEER","SECURITY_GUARD","FACILITY_MANAGER","BUILDER_MANAGER","BDA_ENGINEER","PRESIDENT","SECRETARY")
                .requestMatchers("/api/notices/**")
                    .hasAnyRole("ADMIN","RESIDENT","VOLUNTEER","SECURITY_GUARD","FACILITY_MANAGER","BUILDER_MANAGER","BDA_ENGINEER","PRESIDENT","SECRETARY")
                .requestMatchers("/api/polls/**")
                    .hasAnyRole("ADMIN","RESIDENT","VOLUNTEER","SECURITY_GUARD","FACILITY_MANAGER","BUILDER_MANAGER","BDA_ENGINEER","PRESIDENT","SECRETARY")
                .requestMatchers("/api/complaints/**").hasAnyRole(
                    "ADMIN","RESIDENT","SECURITY_GUARD","FACILITY_MANAGER",
                    "BUILDER_MANAGER","BDA_ENGINEER","PRESIDENT","SECRETARY","VOLUNTEER")
                .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()
                .requestMatchers("/api/users/**").authenticated()
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
