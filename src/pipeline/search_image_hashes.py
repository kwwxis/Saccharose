import psycopg2
from PIL import Image
import imagehash
from dotenv import load_dotenv
import sys
import os

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

if not sys.argv[1].isdigit():
    print("The max hamming distance supplied is invalid. Must be an integer.")
    sys.exit(1)

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

def remove_transparency(img, bg_colour=(255, 255, 255)):
    # Only process if image has transparency (http://stackoverflow.com/a/1963146)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):

        # Need to convert to RGBA if LA format due to a bug in PIL (http://stackoverflow.com/a/1963146)
        alpha = img.convert('RGBA').split()[-1]

        # Create a new background image of our matt color.
        # Must be RGBA because paste requires both images have the same format
        # (http://stackoverflow.com/a/8720632  and  http://stackoverflow.com/a/9459208)
        bg = Image.new("RGBA", img.size, bg_colour + (255,))
        bg.paste(img, mask=alpha)
        return bg
    else:
        return img

def twos_complement(hexstr, bits):
    value = int(hexstr,16) # convert hexadecimal to integer

    # convert from unsigned number to signed number with "bits" bits
    if value & (1 << (bits-1)):
        value -= 1 << bits
    return value

with open(fileName, "rb") as imageBinary:
    img = Image.open(imageBinary)
    img = remove_transparency(img)
    imgHash = str(imagehash.phash(img))
    hashInt = twos_complement(imgHash, 64) # convert from hexadecimal to 64 bit signed integer
    print(hashInt)
    cursor.execute(f"SELECT name, hash FROM genshin_hashes WHERE hash <@ ({hashInt}, {maxDifference})")
    hashRows = cursor.fetchall()
    for x in hashRows:
        xHash = x[1]
        print(x[0] + "|" + str(xHash) + "|" + str(abs(xHash - hashInt)))

sys.stdout.flush()