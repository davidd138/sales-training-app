import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas', 'resolvers'))

from validation import (
    validate_string,
    validate_uuid,
    validate_enum,
    validate_positive_int,
    validate_transcript,
    ValidationError,
)


class TestValidateString:
    def test_valid_string(self):
        assert validate_string("hello", "field") == "hello"

    def test_empty_string_required(self):
        with pytest.raises(ValidationError, match="field is required"):
            validate_string("", "field")

    def test_none_required(self):
        with pytest.raises(ValidationError, match="field is required"):
            validate_string(None, "field")

    def test_none_not_required(self):
        assert validate_string(None, "field", required=False) is None

    def test_exceeds_max_length(self):
        with pytest.raises(ValidationError, match="exceeds max length"):
            validate_string("a" * 101, "field", max_length=100)

    def test_at_max_length(self):
        val = "a" * 100
        assert validate_string(val, "field", max_length=100) == val


class TestValidateUuid:
    def test_valid_uuid(self):
        uuid = "550e8400-e29b-41d4-a716-446655440000"
        assert validate_uuid(uuid, "id") == uuid

    def test_valid_uuid_uppercase(self):
        uuid = "550E8400-E29B-41D4-A716-446655440000"
        assert validate_uuid(uuid, "id") == uuid

    def test_invalid_uuid(self):
        with pytest.raises(ValidationError, match="must be a valid UUID"):
            validate_uuid("not-a-uuid", "id")

    def test_empty_uuid(self):
        with pytest.raises(ValidationError, match="must be a valid UUID"):
            validate_uuid("", "id")

    def test_none_uuid(self):
        with pytest.raises(ValidationError, match="must be a valid UUID"):
            validate_uuid(None, "id")


class TestValidateEnum:
    def test_valid_enum(self):
        assert validate_enum("easy", "difficulty", ["easy", "medium", "hard"]) == "easy"

    def test_invalid_enum(self):
        with pytest.raises(ValidationError, match="must be one of"):
            validate_enum("extreme", "difficulty", ["easy", "medium", "hard"])


class TestValidatePositiveInt:
    def test_valid_int(self):
        assert validate_positive_int(42, "duration") == 42

    def test_zero(self):
        assert validate_positive_int(0, "duration") == 0

    def test_negative(self):
        with pytest.raises(ValidationError, match="must be a positive number"):
            validate_positive_int(-1, "duration")

    def test_exceeds_max(self):
        with pytest.raises(ValidationError, match="must be a positive number"):
            validate_positive_int(100000, "duration")

    def test_float_converted_to_int(self):
        assert validate_positive_int(3.7, "duration") == 3

    def test_string_rejected(self):
        with pytest.raises(ValidationError, match="must be a positive number"):
            validate_positive_int("42", "duration")


class TestValidateTranscript:
    def test_valid_transcript(self):
        t = '[{"role": "user", "text": "Hello"}]'
        assert validate_transcript(t) == t

    def test_non_string(self):
        with pytest.raises(ValidationError, match="must be a string"):
            validate_transcript(123)

    def test_exceeds_max_bytes(self):
        with pytest.raises(ValidationError, match="exceeds max size"):
            validate_transcript("a" * 600_000, max_bytes=512_000)
