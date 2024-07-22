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
const LAST_PARTICIPANT_FILE = path.join(process.cwd(), 'data', 'last_participant.json');

function getLastParticipant(): string | null {
  if (fs.existsSync(LAST_PARTICIPANT_FILE)) {
    const data = fs.readFileSync(LAST_PARTICIPANT_FILE, "utf8");
    return JSON.parse(data).address;
  }
  return null;
}

function saveLastParticipant(address: string) {
  fs.writeFileSync(LAST_PARTICIPANT_FILE, JSON.stringify({ address }));
}

export async function GET(request: Request) {
  const response: ActionGetResponse = {
    icon: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWllMW9idDhucmYwd2tqM3hudnN5Ymg5c3FlZ3EzdzluZDR4azJyZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HFiYHSQCRqcXRSM/giphy.webp",
    description: "Send some SEND coins to the last participant! Be the next in line to receive tokens from the next participant. Join the chain of giving and potentially grow your SEND holdings!",
    title: "Crypto Chain: SEND Forward!",
    label: "SEND & Join the Chain!",
    links: {
      actions: [
        {
          href: "/api/actions/befour?amount={amount}",
          label: "Enter the amount",
          parameters: [
            {
              name: "amount",
              required: true,
              label: "Enter the amount",
            },
          ],
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
    let amount: number = 0.1;

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (error) {
      throw "Invalid account";
    }

    if (url.searchParams.has("amount")) {
      try {
        amount = parseFloat(url.searchParams.get("amount") || "10");
      } catch (error) {
        throw "Invalid amount";
      }
    }

    const connection = new Connection(clusterApiUrl("mainnet-beta"));

    let lastParticipantAddress = getLastParticipant();
    let recipient: PublicKey;

    if (lastParticipantAddress && lastParticipantAddress !== account.toBase58()) {
      recipient = new PublicKey(lastParticipantAddress);
    } else {
      recipient = account;
    }

    saveLastParticipant(account.toBase58());

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

    const transaction = new Transaction();

    transaction.add(
      createTransferInstruction(senderATA, recipientATA, account, amount * Math.pow(10, 6))
    );

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    transaction.feePayer = account;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "You sent SEND to the last participant. You're now next in line to receive!",
      },
    });

    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    let message = "an unknown error";
    if (typeof error == "string") {
      message = error;
    }
    return Response.json({ message }, { headers: ACTIONS_CORS_HEADERS });
  }
};
