import pycld2 as cld2
import json
import sys

if len(sys.argv) < 2:
    print("Not enough arguments")
    sys.exit(1)

if len(sys.argv) > 2:
    print("Too many arguments")
    sys.exit(1)

if sys.argv[1] == '--list':
    print(json.dumps(cld2.LANGUAGES))
    sys.exit(0)

isReliable, textBytesFound, details = cld2.detect(sys.argv[1])

print(json.dumps({
    'isReliable': isReliable,
    'details': [{'langName': item[0], 'langCode': item[1], 'confidence': item[2]} for item in details]
}))