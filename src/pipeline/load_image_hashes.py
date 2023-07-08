# Requires pip libraries: imagehash, psycopg2, python-dotenv

# Useful Info:
#  https://github.com/JohannesBuchner/imagehash
#  https://github.com/JohannesBuchner/imagehash/issues/127
#  https://github.com/JohannesBuchner/imagehash#efficient-database-search
#  https://github.com/KDJDEV/imagehash-reverse-image-search-tutorial

import psycopg2
import os
from io import BytesIO
from PIL import Image
import imagehash
from dotenv import load_dotenv

approot_path = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../'))
dotenv_path = os.path.join(approot_path, '.env')
genshin_images_path = os.path.join(approot_path, 'public/images/genshin')

print("Root Path: " + approot_path)
print("Dotenv Path: " + dotenv_path)
print("Genshin Images Path: " + genshin_images_path)

load_dotenv(dotenv_path)

POSTGRES_HOST = os.environ.get("POSTGRES_HOST")
POSTGRES_DATABASE = os.environ.get("POSTGRES_DATABASE")
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")

def twos_complement(hexstr, bits):
    value = int(hexstr, 16) # convert hexadecimal to integer

    # convert from unsigned number to signed number with "bits" bits
    if value & (1 << (bits-1)):
        value -= 1 << bits
    return value

conn = psycopg2.connect(database = POSTGRES_DATABASE, user = POSTGRES_USER, password = POSTGRES_PASSWORD, host = POSTGRES_HOST)
cursor = conn.cursor()
print("Connection Successful to PostgreSQL")

print("Truncating table and restarting sequence")
cursor.execute("TRUNCATE TABLE genshin_hashes RESTART IDENTITY")

print("Starting file iteration...")
for entry in os.scandir(genshin_images_path):
    with open(entry.path, "rb") as imageBinary:
        if not entry.name.endswith('.png'):
            continue
        img = Image.open(imageBinary)
        imgHash = str(imagehash.ahash(img))
        hashInt = twos_complement(imgHash, 64) # convert from hexadecimal to 64 bit signed integer
        cursor.execute("INSERT INTO genshin_hashes(hash, name) VALUES (%s, %s)", (hashInt, entry.name))
        conn.commit()
        print(f"Added image {entry.name} with hash {hashInt}")

print("Done")