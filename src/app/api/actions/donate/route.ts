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
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, createAssociatedTokenAccountInstruction, createAssociatedTokenAccount, getAssociatedTokenAddress, } from "@solana/spl-token";
import { Keypair, ParsedAccountData, sendAndConfirmTransaction, } from "@solana/web3.js";

const DESTINATION_WALLET = 'HsSgQw9ZSwhyyZTERen2LYdJteRsBH3gnc69Ux69tEUa'; 
const MINT_ADDRESS = 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa'; 
const TRANSFER_AMOUNT = 10;

export async function GET(request: Request) {
  const response: ActionGetResponse = {
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMAtD7IxRUAOINM5ekgGFpf9dgxk_-9FyCug&s",
    description: "Hello World the world is good",
    title: "Hello World",
    label: "Donate",
    links: {
      actions: [
        {
          href: "/api/actions/donate?amount=0.1",
          label: "Donate 0.1 SOL  ",
        },
        {
          href: "/api/actions/donate?amount=1",
          label: "Donate 1 SOL  ",
        },
        {
          href: "/api/actions/donate?amount=10",
          label: "Donate 10 SOL  ",
        },
        {
          href: "/api/actions/donate?amount={amount}",
          label: "Send",
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

    const url = new URL(request.url);
    const body: ActionPostRequest = await request.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (error) {
      throw "Invalid account";
    }

    let amount : number = 0.1;

    if (url.searchParams.has("amount")) {
        try {
          amount = parseFloat(url.searchParams.get("amount") || "0.1");
          console.log(amount);
        } catch (error) {
          throw "Invalid amount";
        }
    }

    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    
    let senderata = await getAssociatedTokenAddress(
        new PublicKey(MINT_ADDRESS),
        account,
        false
    )
    let reciverata = await getAssociatedTokenAddress(
        new PublicKey(MINT_ADDRESS),
        new PublicKey(DESTINATION_WALLET),
        false
    )

    let senderataacc = connection.getAccountInfo(senderata)
    let reciverataacc = connection.getAccountInfo(reciverata)

    // let sourceAccount = await 

    // let destinationAccount = await getOrCreateAssociatedTokenAccount(
    //     connection, 
    //     account,
    //     new PublicKey(MINT_ADDRESS),
    //     new PublicKey(DESTINATION_WALLET)
    // );

    const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            account,
            new PublicKey(DESTINATION_WALLET),
            new PublicKey(MINT_ADDRESS),
            account
        ),
        createAssociatedTokenAccountInstruction(
            account,
            new PublicKey(account),
            new PublicKey(MINT_ADDRESS),
            account
        ),
        createTransferInstruction(
            senderata,
            reciverata,
            account,
            TRANSFER_AMOUNT * Math.pow(10, 6)
        )
    );
    
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = account;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Hello thans for the donation",
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
