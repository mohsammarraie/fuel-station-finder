package com.fuelstationfinder;

import java.util.List;

public class InvalidQueryException extends RuntimeException {
    private final List<QueryIssue> details;
    public InvalidQueryException(List<QueryIssue> details) {
        this.details = List.copyOf(details);
    }
    public List<QueryIssue> details() { return details; }
}
