def handler(event, context):
    # Do NOT auto-confirm; user must verify email with code
    event["response"]["autoConfirmUser"] = False
    event["response"]["autoVerifyEmail"] = False
    return event
