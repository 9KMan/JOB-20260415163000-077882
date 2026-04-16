import firebase_admin
from firebase_admin import credentials, firestore


def init_firebase():
    try:
        firebase_admin.initialize_app()
    except ValueError:
        pass

    return firestore.client()


db = init_firebase()
