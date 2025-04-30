/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//     logger.info("Hello logs!", {structuredData: true});
//     response.send("Hello from Firebase!");
// });

initializeApp();

export const setFieldInCollection = onCall(async (request, response) => {
  try {
    const db = getFirestore();

    const querySnapshot = await db.collection(
      request.data.collectionPath
    ).get();

    if (querySnapshot.size === 0) {
      logger.warn("No documents to update");
      return "No documents to update";
    }

    // hold batches to update at once
    const batches: FirebaseFirestore.WriteBatch[] = [];

    querySnapshot.docs.forEach((doc, i) => {
      if (i % 500 === 0) {
        batches.push(db.batch());
      }

      const batch = batches[batches.length - 1];
      const updateObj: any = {
        merge: true,
      };
      updateObj[request.data.fieldName] = request.data.fieldValue;
      batch.set(doc.ref, updateObj);
    });

    await Promise.all(batches.map((batch) => batch.commit()));
    logger.info(`${querySnapshot.size} documents updated`);
    return `${querySnapshot.size} documents updated`;
  } catch (error) {
    logger.info(`***ERROR: ${error}`, {structuredData: true});
    return error;
  }
});
/*
export const updatePfpRef = onDocumentWritten("users/{docId}", (event) => {
    if (event.data?.before.get("pfpRef") != event.data?.after.get("pfpRef")) {

    }

});


export const createUser = onCall(async (request, response) => {
    try {
        const db = getFirestore();
        const auth = getAuth();
        const storage = getStorage();
        const bucket = storage.bucket(firebaseConfig.storageBucket);

        const userRef = db.collection("users").doc();

        try {
            const emailUser = await auth.getUserByEmail(request.data.email);
            throw new Error(`User ${emailUser} already exists.`);
        } catch (error) {
            if (!(error instanceof FirebaseAuthError) ||
                error.code !== "auth/user-not-found") {
                throw error;
            }
        }
        if (request.data.phoneNumber !== undefined) {
            try {
                const phoneNumberUser = await auth.getUserByPhoneNumber(
                    request.data.phoneNumber
                );
                throw new Error(`User ${phoneNumberUser} already exists.`);
            } catch (error) {
                if (!(error instanceof FirebaseAuthError) ||
                    error.code !== "auth/user-not-found") {
                    throw error;
                }

            }
        }

        const result = await db.runTransaction(async (transaction) => {
            const userData: UserData = {
                id: userRef.id,
                name: request.data.name,
                email: request.data.email,
                pfpUrl: null,
                phoneNumber: request.data.phoneNumber ?? null,
                emailVertified: false,
                createdAt: Timestamp.now(),
                timesOwnItemLost: 0,
                timesOwnItemFound: 0,
                timesOthersItemFound: 0,
                blockedList: [],
                friendsList: [],
                privateStats: false,
            };

            if (request.data.pfpUri) {
                const pfpFile = bucket.file("images/pfps/" + userRef.id);
                await pfpFile.get({
                    autoCreate: true,
                });

                await bucket.upload(request.data.pfpUri, {
                    destination: pfpFile,
                    onUploadProgress: (event) => {

                    },
                });

                const pfpFileGet = await pfpFile.get();
                pfpFileGet[0].publicUrl({

                })
            }

            transaction.set(userRef, userData);

            return userData;
        });

        return await auth.createUser({
            uid: userRef.id,
            displayName: (result as UserData).name,
            email: (result as UserData).email,
            password: request.data.password,
            photoURL: (result as UserData).pfpUrl ?? null,
            emailVerified: false,
            phoneNumber: (result as UserData).phoneNumber ?? null,
        });

    } catch (error) {
        console.warn(error);
        return await error;
    }
});
/*
export const uploadImage = onCall(async (request, response) => {
    return new Promise(async (resolve, reject) => {
        try {
            const imageRef = bucket.upload();
            await bucket.upload(request.data.path, {

            });

            await uploadBytes(imageRef, blob)
            const url = await getDownloadURL(imageRef!);

            console.log(url);
            resolve(url);
            return;
        } catch (err) {
            reject(err);
            return;
        }
    });
});*/
