import psycopg2
from PIL import Image
import imagehash
from dotenv import load_dotenv
import sys

if len(sys.argv) < 3:
    print("Not enough arguments")
    sys.exit(1)

approot_path = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../'))
dotenv_path = os.path.join(approot_path, '.env')
genshin_images_path = os.path.join(approot_path, 'public/images/genshin')

load_dotenv(dotenv_path)

POSTGRES_HOST = os.environ.get("POSTGRES_HOST")
POSTGRES_DATABASE = os.environ.get("POSTGRES_DATABASE")
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
TMP_UPLOAD_DIR = os.environ.get("TMP_UPLOAD_DIR")

maxDifference = int(sys.argv[1])
fileName = sys.argv[2]

if not fileName.endswith('.png') or ".." in fileName or "/" in fileName:
    print("Invalid filename")
    sys.exit(1)

if TMP_UPLOAD_DIR.endswith('/'):
    TMP_UPLOAD_DIR = TMP_UPLOAD_DIR[:-1]

fileName = TMP_UPLOAD_DIR + '/' + fileName

conn = psycopg2.connect(database = POSTGRES_DATABASE, user = POSTGRES_USER, password = POSTGRES_PASSWORD, host = POSTGRES_HOST)
cursor = conn.cursor()

def twos_complement(hexstr, bits):
    value = int(hexstr,16) # convert hexadecimal to integer

    # convert from unsigned number to signed number with "bits" bits
    if value & (1 << (bits-1)):
        value -= 1 << bits
    return value

with open(fileName, "rb") as imageBinary:
    img = Image.open(imageBinary)
    imgHash = str(imagehash.dhash(img))
    hashInt = twos_complement(imgHash, 64) # convert from hexadecimal to 64 bit signed integer
    cursor.execute(f"SELECT name FROM genshin_hashes WHERE hash <@ ({hashInt}, {maxDifference})")
    hashRows = cursor.fetchall()
    names = [x[0] for x in hashRows]
    for name in names:
        print(name)