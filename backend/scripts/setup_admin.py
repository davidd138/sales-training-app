"""Setup script: Create admin user in Cognito and DynamoDB.

Usage:
    python3 setup_admin.py <email> <password> <name>

Example:
    python3 setup_admin.py profesor@universidad.es 'MyP@ssword123!' 'Dr. Garcia'
"""
import sys
import boto3

REGION = "eu-west-1"
USER_POOL_ID = "eu-west-1_lp5QJAgf1"
CLIENT_ID = "7djdf4vlvrlfr30la9bad24q7s"
USERS_TABLE = "dev-st-users"


def setup_admin(email: str, password: str, name: str):
    cognito = boto3.client("cognito-idp", region_name=REGION)
    dynamodb = boto3.resource("dynamodb", region_name=REGION)
    table = dynamodb.Table(USERS_TABLE)

    # 1. Create user in Cognito
    print(f"Creating user {email} in Cognito...")
    try:
        cognito.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "name", "Value": name},
            ],
            MessageAction="SUPPRESS",  # Don't send welcome email
        )
    except cognito.exceptions.UsernameExistsException:
        print(f"  User {email} already exists in Cognito")

    # 2. Set permanent password
    print("Setting password...")
    cognito.admin_set_user_password(
        UserPoolId=USER_POOL_ID,
        Username=email,
        Password=password,
        Permanent=True,
    )

    # 3. Get user sub (unique ID)
    user = cognito.admin_get_user(
        UserPoolId=USER_POOL_ID,
        Username=email,
    )
    attrs = {a["Name"]: a["Value"] for a in user.get("UserAttributes", [])}
    user_id = attrs.get("sub", "")
    print(f"  User ID: {user_id}")

    # 4. Ensure admins group exists
    print("Ensuring admins group exists...")
    try:
        cognito.create_group(
            UserPoolId=USER_POOL_ID,
            GroupName="admins",
            Description="Administrator users (professors)",
        )
        print("  Created admins group")
    except cognito.exceptions.GroupExistsException:
        print("  admins group already exists")

    # 5. Add user to admins group
    print("Adding user to admins group...")
    cognito.admin_add_user_to_group(
        UserPoolId=USER_POOL_ID,
        Username=email,
        GroupName="admins",
    )

    # 6. Create/update user in DynamoDB
    print("Updating DynamoDB...")
    table.put_item(Item={
        "userId": user_id,
        "email": email.lower(),
        "name": name,
        "role": "admin",
        "status": "active",
    })

    print(f"\nAdmin user created successfully!")
    print(f"  Email: {email}")
    print(f"  Name: {name}")
    print(f"  User ID: {user_id}")
    print(f"  Login at: https://d37iyzx8veabdy.cloudfront.net/login")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    setup_admin(sys.argv[1], sys.argv[2], sys.argv[3])
