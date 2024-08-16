import { ACTIONS_CORS_HEADERS, ActionsJson } from "@solana/actions";

export async function GET(request: Request) {
    try {
    const response: ActionsJson = {
        rules: [
            {
                pathPattern: "/",
                apiPath: "/api/actions/flip",
            },
            {
                pathPattern: "/flip",
                apiPath: "/api/actions/flip",
            },

            {
                pathPattern: "/api/actions/flip",
                apiPath: "/api/actions/flip",
            }
        ]
    };
    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
} catch (error) {
    console.error("Error in actions routing:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500, headers: ACTIONS_CORS_HEADERS });
}
  }
  
  export const OPTIONS = GET;

//   export async function POST(request: Request) {

// export async function POST(request: Request)