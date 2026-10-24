package edu.rupp.enrollment.model;

public final class Enums {
    private Enums() {}

    public enum Role { STUDENT, ADMIN, OFFICER }

    public enum AppStatus { DRAFT, PENDING_REVIEW, INCOMPLETE, ELIGIBLE, EXAM_SCHEDULED, EXAM_COMPLETED, RESULT_PUBLISHED }

    public enum Decision { ADMITTED, PENDING, NOT_ADMITTED }

    public enum QuestionType { MCQ, WRITTEN }

    public enum AttemptStatus { IN_PROGRESS, SUBMITTED, GRADED }
}
