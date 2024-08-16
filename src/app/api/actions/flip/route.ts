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
    description: "Hi, Every time you participate, you'll send 100 SEND coins to a random player and have the chance to receive coins from others. It's a fun way to circulate tokens, and potentially grow your SEND holdings. sending joy to others and possibly receiving a surprise return!",
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

export async function POST(request: Request) {
  let body: ActionPostRequest;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return Response.json("Invalid JSON in request body" , { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const url = new URL(request.url);

  let account: PublicKey;
  try {
    account = new PublicKey(body.account);
  } catch (error) {
    return Response.json("Invalid account", { headers: ACTIONS_CORS_HEADERS });
  }

  let connection;
  try {
    connection = new Connection(clusterApiUrl("mainnet-beta"));
  } catch {
    return Response.json("Cannot connect to Solana", { headers: ACTIONS_CORS_HEADERS });
  }

  let participants;
  try {
    participants = getParticipants();
  } catch (error) {
    return Response.json("Cannot get participants", { headers: ACTIONS_CORS_HEADERS });
  }

  let recipient: PublicKey;
  try {
    if (participants.includes(account.toBase58())) {
      let tempParticipants = participants.filter((p) => p !== account.toBase58());
      const randomIndex = Math.floor(Math.random() * tempParticipants.length);
      recipient = new PublicKey(tempParticipants[randomIndex]);
    } else {
      recipient = new PublicKey(participants[Math.floor(Math.random() * participants.length)]);
    }
  } catch (error) {
    return Response.json("Cannot select recipient", { headers: ACTIONS_CORS_HEADERS });
  }

  let senderATA, recipientATA;
  try {
    senderATA = await getAssociatedTokenAddress(
      new PublicKey(MINT_ADDRESS),
      account,
      false
    );
    recipientATA = await getAssociatedTokenAddress(
      new PublicKey(MINT_ADDRESS),
      recipient,
      false
    );
  } catch (error) {
    return Response.json("Cannot get associated token addresses", { headers: ACTIONS_CORS_HEADERS });
  }

  console.log("Sender: ", account.toBase58());
  console.log("Recipient: ", recipient.toBase58());
  console.log("Sender ATA: ", senderATA.toBase58());
  console.log("Recipient ATA: ", recipientATA.toBase58());

  const transaction = new Transaction();

  try {
    console.log("blockhash: ", await connection.getLatestBlockhash());
  } catch (error) {
    return Response.json("Cannot get latest blockhash", { headers: ACTIONS_CORS_HEADERS });
  }

  console.log("Transaction: ", transaction);

  try {
    transaction.add(
      createTransferInstruction(senderATA, recipientATA, account, TRANSFER_AMOUNT * Math.pow(10, 6))
    );
  } catch (error) {
    return Response.json("Cannot create transfer instruction", { headers: ACTIONS_CORS_HEADERS });
  }

  console.log("Transaction WITH PARAMETER : ", transaction);

  transaction.feePayer = account;
  console.log("Transaction WITH payer : ", transaction);

  try {
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
  } catch (error) {
    return Response.json("Cannot set recent blockhash", { headers: ACTIONS_CORS_HEADERS });
  }

  console.log("Transaction WITH blockhash : ", transaction);

  let payload: ActionPostResponse;
  try {
    payload = await createPostResponse({
      fields: {
        transaction,
        message: "You sent 100 'SEND' coins to a random participant",
      },
    });
  } catch (error) {
    return Response.json("Cannot create post response", { headers: ACTIONS_CORS_HEADERS });
  }

  try {
    if (!participants.includes(account.toBase58())) {
      participants.push(account.toBase58());
      saveParticipants(participants);
    }
  } catch (error) {
    return Response.json("Cannot update participants list", { headers: ACTIONS_CORS_HEADERS });
  }

  try {
    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch {
    return Response.json("Error in last", { headers: ACTIONS_CORS_HEADERS });
  }
};