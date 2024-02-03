# Requires pip libraries: imagehash, psycopg2, python-dotenv

# Useful Info:
#  - https://github.com/JohannesBuchner/imagehash
#  - https://github.com/JohannesBuchner/imagehash/issues/127
#  - https://github.com/JohannesBuchner/imagehash#efficient-database-search
#  - https://github.com/KDJDEV/imagehash-reverse-image-search-tutorial

# Other potentially useful info:
#  - https://github.com/soruly/trace.moe-api/tree/master
#  - https://github.com/RAHUL-KAD/Reverse-Image-Search-Engine
#  - https://github.com/cqcore/Image-Research-OSINT
#  - https://fireship.io/lessons/image-search-engine/

import psycopg2
import os
from io import BytesIO
from PIL import Image
import imagehash
from dotenv import load_dotenv

approot_path = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../'))
dotenv_path = os.path.join(approot_path, '.env')

print("Root Path: " + approot_path)
print("Dotenv Path: " + dotenv_path)

load_dotenv(dotenv_path)

POSTGRES_HOST = os.environ.get("POSTGRES_HOST")
POSTGRES_DATABASE = os.environ.get("POSTGRES_DATABASE")
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")

genshin_images_path = os.environ.get("EXT_GENSHIN_IMAGES")
print("Genshin Images Path: " + genshin_images_path)

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
    value = int(hexstr, 16) # convert hexadecimal to integer

    # convert from unsigned number to signed number with "bits" bits
    if value & (1 << (bits-1)):
        value -= 1 << bits
    return value

conn = psycopg2.connect(database = POSTGRES_DATABASE, user = POSTGRES_USER, password = POSTGRES_PASSWORD, host = POSTGRES_HOST)
cursor = conn.cursor()
print("Connection Successful to PostgreSQL")

print("Truncating table and restarting sequence")
cursor.execute("TRUNCATE TABLE genshin_image_hashes RESTART IDENTITY")

print("Starting file iteration...")
for entry in os.scandir(genshin_images_path):
    with open(entry.path, "rb") as imageBinary:
        if not entry.name.endswith('.png'):
            continue
        img = Image.open(imageBinary)
        img = remove_transparency(img)
        imgHash = str(imagehash.phash(img))
        hashInt = twos_complement(imgHash, 64) # convert from hexadecimal to 64 bit signed integer
        cursor.execute("INSERT INTO genshin_image_hashes(hash, name) VALUES (%s, %s)", (hashInt, entry.name))
        conn.commit()
        print(f"Added image {entry.name} with hash {hashInt}")

print("Done")
