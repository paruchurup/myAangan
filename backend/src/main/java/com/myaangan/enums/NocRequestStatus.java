package com.myaangan.enums;
public enum NocRequestStatus {
    PENDING,    // Resident requested, waiting for Admin to upload
    FULFILLED,  // Admin has uploaded the NOC document
    REJECTED    // Admin rejected the request with a reason
}
