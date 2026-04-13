from pymongo import MongoClient

MONGO_URL = "mongodb+srv://admin:strongpassword123@cluster0.sz5du3d.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URL)

db = client["smartlinkx"]
users_collection = db["users"]
hubs_collection = db["hubs"]
account_settings_collection = db["account_settings"]
analytics_collection = db["analytics"]

