import { ACTIONS_CORS_HEADERS, ActionsJson } from "@solana/actions";

export const GET = async () => {
    try {
    const payload: ActionsJson = {
        rules: [
            {
                pathPattern: "/",
                apiPath: "/api/actions/flip",
            },
            {
                pathPattern: "/*",
                apiPath: "/api/actions/flip",
            },
            {
                pathPattern: "/**",
                apiPath: "/api/actions/flip",
            },
            {
                pathPattern: "/***",
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
    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
} catch (error) {
    console.error("Error in actions routing:", error);
    return Response.json("Internal Server Error hai yahan " , { status: 500, headers: ACTIONS_CORS_HEADERS });
}
  }
  
  export const OPTIONS = GET;

//   export async function POST(request: Request) {

// export async function POST(request: Request)