"""Shared input validation utilities for Lambda resolvers."""
import re

UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)


class ValidationError(Exception):
    pass


def validate_string(value, field_name, max_length=1000, required=True):
    if required and (not value or not isinstance(value, str)):
        raise ValidationError(f"{field_name} is required")
    if isinstance(value, str) and len(value) > max_length:
        raise ValidationError(f"{field_name} exceeds max length of {max_length}")
    return value


def validate_uuid(value, field_name):
    if not value or not isinstance(value, str) or not UUID_RE.match(value):
        raise ValidationError(f"{field_name} must be a valid UUID")
    return value


def validate_enum(value, field_name, allowed_values):
    if value not in allowed_values:
        raise ValidationError(f"{field_name} must be one of: {', '.join(allowed_values)}")
    return value


def validate_positive_int(value, field_name, max_value=86400):
    if not isinstance(value, (int, float)) or value < 0 or value > max_value:
        raise ValidationError(f"{field_name} must be a positive number (max {max_value})")
    return int(value)


def validate_transcript(value, field_name="transcript", max_bytes=512_000):
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be a string")
    if len(value.encode('utf-8')) > max_bytes:
        raise ValidationError(f"{field_name} exceeds max size of {max_bytes} bytes")
    return value
