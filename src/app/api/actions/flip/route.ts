import {
  ActionGetResponse,
  ActionPostResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

const MINT_ADDRESS = "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa";
const PARTICIPANTS_FILE = path.join(process.cwd(), 'data', 'participants.json');
const TRANSFER_AMOUNT = 100;

function getParticipants(): string[] {
  if (fs.existsSync(PARTICIPANTS_FILE)) {
    const data = fs.readFileSync(PARTICIPANTS_FILE, "utf8");
    return JSON.parse(data);
  }
  return [];
}

function saveParticipants(participants: string[]) {
  fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(participants));
}

export async function GET(request: Request) {
    let participants = getParticipants();
  const response: ActionGetResponse = {
    icon: "https://i.pinimg.com/originals/dc/ce/27/dcce2718f4eacbd4c021573ed05aa91b.png",
    description: "Every time you participate, you'll send 100 SEND coins to a random player and have the chance to receive coins from others. It's a fun way to circulate tokens, and potentially grow your SEND holdings. sending joy to others and possibly receiving a surprise return!",
    title:
      `Crypto Karma: SEND Some, Get Some! ${participants.length} Players and Counting...`,
    label: "SEND 100 & Play!",
    links: {
      actions: [
        {
          href: "/api/actions/flip",
          label: "SEND 100 & Play!",
        },
      ],
    },
    
  };
  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}

export const OPTIONS = GET;

export const POST = async (request: Request) => {
  try {
    const body: ActionPostRequest = await request.json();
    const url = new URL(request.url);

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (error) {
      throw "Invalid account";
    }

    const connection = new Connection(clusterApiUrl("mainnet-beta"));

    // Get current participants and add the new one
    let participants = getParticipants();

    // Choose a random recipient (excluding the sender)
    let recipient: PublicKey;

    if (participants.includes(account.toBase58())) {
      let tempParticipants = participants.filter((p) => p !== account.toBase58());
      const randomIndex = Math.floor(Math.random() * tempParticipants.length);
      recipient = new PublicKey(tempParticipants[randomIndex]);
      
    } else {
      recipient = new PublicKey(participants[Math.floor(Math.random() * participants.length)]);
    }

    // do {
    //   const randomIndex = Math.floor(Math.random() * participants.length);
    //   recipient = new PublicKey(participants[randomIndex]);
    // } while (recipient.equals(account));

     let senderATA = await getAssociatedTokenAddress(
      new PublicKey(MINT_ADDRESS),
      account,
      false
    );

    let recipientATA = await getAssociatedTokenAddress(
      new PublicKey(MINT_ADDRESS),
      recipient,
      false
    );

    // CONSOLE LOG EVERYTHING 
    console.log("Sender: ", account.toBase58());
    console.log("Recipient: ", recipient.toBase58());
    console.log("Sender ATA: ", senderATA.toBase58());
    console.log("Recipient ATA: ", recipientATA.toBase58());


    const transaction = new Transaction();

    console.log("blockhash: ", await connection.getLatestBlockhash())

    // CONSOLE LOG EVERYTHING ELSE 
    console.log("Transaction: ", transaction);

    transaction.add(
      createTransferInstruction(senderATA, recipientATA, account, TRANSFER_AMOUNT * Math.pow(10, 6))
    );
    // CONSOLE LOG EVERYTHING ELSE 
    console.log("Transaction WITH PARAMETER : ", transaction);

    transaction.feePayer = account;
     // CONSOLE LOG EVERYTHING ELSE 
     console.log("Transaction WITH payer : ", transaction);

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

     // CONSOLE LOG EVERYTHING ELSE 
    console.log("Transaction WITH blockhesh : ", transaction);

    
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "You sent 100 'SEND' coins to a random participant",
      },
    });

    if (!participants.includes(account.toBase58())) {
      participants.push(account.toBase58());
      saveParticipants(participants);
    }

    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    let message = "an unknown error";
    if (typeof error == "string") {
      message = error;
    }
    return Response.json({ message }, { headers: ACTIONS_CORS_HEADERS });
  }
};
