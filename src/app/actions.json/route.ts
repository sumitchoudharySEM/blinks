import { ACTIONS_CORS_HEADERS, ActionsJson } from "@solana/actions";

export async function GET(request: Request) {
    const response: ActionsJson = {
        rules: [
            {
                pathPattern: "/",
                apiPath: "/api/actions/donate",
            },
        ]
    };
    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
  }
  
  export const OPTIONS = GET;