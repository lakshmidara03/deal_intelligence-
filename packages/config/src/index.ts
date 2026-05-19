export const appConfig = {
  productName: "Deal Boards",
  defaultBoardId: "my-deals",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001"
};
