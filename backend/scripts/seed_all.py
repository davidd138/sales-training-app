"""Seed all initial data: scenarios + guidelines.

Usage:
    python3 seed_all.py [--clear]

    --clear: Delete existing data before seeding
"""
import sys

def main():
    clear = "--clear" in sys.argv

    if clear:
        print("=== Clearing existing data ===")
        import boto3
        dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")

        for table_name in ["dev-st-scenarios", "dev-st-guidelines"]:
            table = dynamodb.Table(table_name)
            response = table.scan()
            items = response.get("Items", [])
            pk = "id"
            for item in items:
                table.delete_item(Key={pk: item[pk]})
            print(f"  Cleared {len(items)} items from {table_name}")
        print()

    print("=== Seeding scenarios ===")
    from seed_scenarios import seed as seed_scenarios
    seed_scenarios()

    print("\n=== Seeding guidelines ===")
    from seed_guidelines import seed as seed_guidelines
    seed_guidelines()

    print("\n=== All data seeded successfully! ===")


if __name__ == "__main__":
    main()
