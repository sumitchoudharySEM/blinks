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
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export async function GET(request: Request) {
  const response: ActionGetResponse = {
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMAtD7IxRUAOINM5ekgGFpf9dgxk_-9FyCug&s",
    description: "Hello World the world is good",
    title: "Hello World",
    label: "Donate",
  };
  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}

export const OPTIONS = GET;

export const POST = async (request: Request) => {
  try {
    const body : ActionPostRequest = await request.json();
    let account: PublicKey;
    try{
        account = new PublicKey(body.account);
    } catch (error) {
      throw "Invalid account";
    }

    const connection = new Connection(clusterApiUrl("devnet"));

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: account,
            toPubkey: new PublicKey("2n6rwsFfpKs9NZpfEUoYWJ1j1ZzckTqQ1Uqs3kqVPmtd"),
            lamports: 10,
        })
    );
    transaction.feePayer = account;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const payload : ActionPostResponse  = await createPostResponse({
        fields: {
            transaction,
            message: "Hello thans for the donation",
        },
    });
    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });

  } catch (error) {
    let message = "an unknown error";
    if (typeof error == "string" ) {
        message = error;
    }
    return Response.json(
      {  message },
      { headers: ACTIONS_CORS_HEADERS }
    );
  }

};
