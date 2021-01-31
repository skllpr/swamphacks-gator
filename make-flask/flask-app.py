from flask import Flask , jsonify, request
from flask_cors import CORS
import time
import logging
from argparse import ArgumentParser, RawTextHelpFormatter
import psycopg2

list = 1
app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
    return "Swamphacks Project"

def initialize(conn):
    with conn.cursor() as cur:
        cur.execute(
            "CREATE TABLE IF NOT EXISTS messages (list INT PRIMARY KEY, latitude STRING, longitude STRING, message STRING)"
        )
        cur.execute("UPSERT INTO messages VALUES (999, '29.292', '29.786', 'yo')")
        logging.debug("initialize(): status message: %s", cur.statusmessage)
    conn.commit()

def delete_table(conn):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM notes.messages")
        logging.debug("delete_table(): status message: %s", cur.statusmessage)
    conn.commit()

@app.route("/delete")
def delete():
    opt = parse_cmdline()
    logging.basicConfig(level=logging.DEBUG if opt.verbose else logging.INFO)
    conn = psycopg2.connect(opt.dsn)
    delete_table(conn)

def print_content(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT latitude, longitude, message FROM messages")
        logging.debug("print_content(): status message: %s", cur.statusmessage)
        rows = cur.fetchall()
        conn.commit()
        print(f"Content at {time.asctime()}:")
        for row in rows:
            print(row)
        return rows

@app.route("/getdata")
def getdata():
    opt = parse_cmdline()
    logging.basicConfig(level=logging.DEBUG if opt.verbose else logging.INFO)
    conn = psycopg2.connect(opt.dsn)
    data = print_content(conn)
    return jsonify({"data": data})

def insert_row(conn, latitude, longitude, message):
    with conn.cursor() as cur:

        # Check the current balance.
        cur.execute("UPSERT INTO messages VALUES ("+list+", "+latitude+", "+longitude+", "+message+")")
        list = list +1

        if latitude > 90 or latitude < -90:
            raise RuntimeError(
                f"Invalid latitude"
            )

        if longitude > 180 or longitude < -180:
            raise RuntimeError(
                f"Invalid longitude"
            )

    conn.commit()
    logging.debug("insert_row(): status message: %s", cur.statusmessage)

@app.route('/insert')
def insert():
    content = request.json
    opt = parse_cmdline()
    logging.basicConfig(level=logging.DEBUG if opt.verbose else logging.INFO)
    conn = psycopg2.connect(opt.dsn)
    insert_row(conn, content.latitude, content.longitude, content.message)

def main():
    opt = parse_cmdline()
    logging.basicConfig(level=logging.DEBUG if opt.verbose else logging.INFO)
    conn = psycopg2.connect(opt.dsn)
    initialize(conn)
    print_content(conn)
    # Close communication with the database.
    conn.close()

def parse_cmdline():
    parser = ArgumentParser(description=__doc__,
                            formatter_class=RawTextHelpFormatter)
    parser.add_argument(
        "dsn",
        help="""database connection string\n\n
             For cockroach demo, use 'postgresql://<username>:<password>@<hostname>:<port>/bank?sslmode=require',\n
             with the username and password created in the demo cluster, and the hostname and port listed in the\n
             (sql/tcp) connection parameters of the demo cluster welcome message.\n\n
             For CockroachCloud Free, use 'postgres://<username>:<password>@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/<cluster-name>.bank?sslmode=verify-full&sslrootcert=<your_certs_directory>/cc-ca.crt'.\n
             If you are using the connection string copied from the Console, your username, password, and cluster name will be pre-populated.\n
             Replace <your_certs_directory> with the path to the cc-ca.cert downloaded from the Console."""
    )

    parser.add_argument("-v", "--verbose",
                        action="store_true", help="print debug info")

    opt = parser.parse_args()
    return opt

if __name__ == "__main__":
    main()
    app.run()

