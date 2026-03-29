import { Client, Account, ID } from 'appwrite';

const client = new Client();

import { getPublicConfig } from '../config';

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } = getPublicConfig();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);


export const account = new Account(client);
export { ID, Client };
