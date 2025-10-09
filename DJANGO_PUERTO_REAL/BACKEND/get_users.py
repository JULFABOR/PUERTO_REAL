import MySQLdb
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

print("Running get_users.py...")

try:
    # Connect to the database
    conn = MySQLdb.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        passwd=os.getenv('DB_PASSWORD'),
        db=os.getenv('DB_NAME')
    )

    # Create a cursor
    cursor = conn.cursor()

    # Execute the query
    cursor.execute("SELECT username FROM auth_user;")

    # Fetch all the results
    users = cursor.fetchall()

    # Print the usernames
    for user in users:
        print(user[0])

except MySQLdb.Error as e:
    print(f"Error connecting to MySQL: {e}", file=sys.stderr)

finally:
    # Close the cursor and connection
    if 'cursor' in locals() and cursor is not None:
        cursor.close()
    if 'conn' in locals() and conn:
        conn.close()