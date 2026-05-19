import { Injectable } from "@nestjs/common";

const BOARD_SEED = [
  {
    slug: "my-deals",
    title: "My Deals",
    description: "Personal pipeline with locked AE ownership filters.",
    owner: "Sales Rep",
    lockedFilter: "Owner = Sales Rep"
  },
  {
    slug: "enterprise-deals-q2",
    title: "Enterprise Deals Q2",
    description: "Enterprise opportunities closing this quarter.",
    owner: "Sales Rep",
    lockedFilter: "Segment = Enterprise"
  },
  {
    slug: "strategic-accounts",
    title: "Strategic Accounts",
    description: "High-value strategic account opportunities.",
    owner: "Sales Rep",
    lockedFilter: "Tier = Strategic"
  }
];

@Injectable()
export class BoardsService {
  async list() {
    return BOARD_SEED.map((board) => ({
      id: board.slug,
      title: board.title,
      description: board.description,
      owner: board.owner,
      lockedFilter: board.lockedFilter,
      lastModified: new Date().toISOString()
    }));
  }
}
