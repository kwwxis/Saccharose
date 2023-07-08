# Requires pip libraries: imagehash, psycopg2, python-dotenv

import psycopg2
import os
from io import BytesIO
from PIL import Image
import imagehash
from dotenv import load_dotenv

approot_path = os.path.join(dirname(__file__), '../../')
dotenv_path = os.path.join(approot_path, './.env')
genshin_images_path = os.path.join(approot_path, './public/images/genshin')

print("Root Path" + root_path)
print("Dotenv Path" + dotenv_path)
print("Dotenv Path" + dotenv_path)

load_dotenv(dotenv_path)

POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")

def twos_complement(hexstr, bits):
    value = int(hexstr, 16) # convert hexadecimal to integer

    # convert from unsigned number to signed number with "bits" bits
    if value & (1 << (bits-1)):
        value -= 1 << bits
    return value

conn = psycopg2.connect(database = "saccharose", user = POSTGRES_USER, password = POSTGRES_PASSWORD, host = "127.0.0.1")
cursor = conn.cursor()
print("Connection Successful to PostgreSQL")

for entry in os.scandir(genshin_images_path):
	with open(entry.path, "rb") as imageBinary:
		img = Image.open(imageBinary)
		imgHash = str(imagehash.dhash(img))
		hashInt = twos_complement(imgHash, 64) #convert from hexadecimal to 64 bit signed integer
		cursor.execute("INSERT INTO genshin_hashes(hash, name) VALUES (%s, %s)", (hashInt, entry.name))
		conn.commit()
		print(f"Added image {entry.name} with hash {hashInt}")
		
print("Done")