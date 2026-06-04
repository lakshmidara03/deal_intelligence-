import { Injectable } from '@nestjs/common';
import { DealBoard, TransformedDeal } from '../interfaces/hubspot.types';

@Injectable()
export class DealsService {
  // Mock data for fallback when HubSpot API fails
  
  getMockDealBoards(): DealBoard[] {
    return [
      {
        boardId: '1',
        name: 'My Deals',
        description: 'Personal deal tracking and management',
        owner: 'John Smith',
        ownerId: '1',
        lastModified: new Date().toISOString(),
        dealCount: 12,
        totalAmount: 450000,
        canEdit: true,
        pipeline: 'default',
      },
      {
        boardId: '2',
        name: 'Enterprise Deals Q2',
        description: 'All enterprise opportunities for Q2 2026',
        owner: 'Sarah Chen',
        ownerId: '2',
        lastModified: new Date(Date.now() - 86400000).toISOString(),
        dealCount: 8,
        totalAmount: 1200000,
        canEdit: false,
        pipeline: 'sales',
      },
      {
        boardId: '3',
        name: 'Team Pipeline - West',
        description: 'Western region team pipeline overview',
        owner: 'Michael Rodriguez',
        ownerId: '3',
        lastModified: new Date(Date.now() - 172800000).toISOString(),
        dealCount: 15,
        totalAmount: 850000,
        canEdit: false,
        pipeline: 'default',
      },
      {
        boardId: '4',
        name: 'Strategic Accounts',
        description: 'High-value strategic account opportunities',
        owner: 'Jennifer Kim',
        ownerId: '4',
        lastModified: new Date(Date.now() - 259200000).toISOString(),
        dealCount: 6,
        totalAmount: 2100000,
        canEdit: true,
        pipeline: 'sales',
      },
    ];
  }

  getMockBoardDetail(boardId: string): any {
    const boards = this.getMockDealBoards();
    const board = boards.find(b => b.boardId === boardId) || boards[0];
    const deals = this.getMockDeals(boardId);
    
    return {
      ...board,
      deals,
      stages: [
        { name: 'Appointment Scheduled', count: 3, amount: 75000 },
        { name: 'Qualified to Buy', count: 5, amount: 180000 },
        { name: 'Presentation Scheduled', count: 4, amount: 320000 },
        { name: 'Decision Maker Bought-In', count: 2, amount: 450000 },
        { name: 'Contract Sent', count: 1, amount: 125000 },
        { name: 'Closed Won', count: 2, amount: 280000 },
        { name: 'Closed Lost', count: 1, amount: 45000 },
      ],
    };
  }

  getMockDeals(boardId: string): TransformedDeal[] {
    const baseDeals: TransformedDeal[] = [
      {
        dealId: 'deal-1',
        dealName: 'Acme Corp - Enterprise License',
        amount: 125000,
        stage: 'Contract Sent',
        pipeline: 'default',
        closeDate: '2026-06-15',
        createDate: '2026-03-01',
        ownerId: '1',
        ownerName: 'John Smith',
        forecastCategory: 'Commit',
        probability: 80,
        dealType: 'New Business',
        contacts: [
          { contactId: 'c1', name: 'Jane Doe', email: 'jane@acme.com', phone: '+1-555-0101' },
          { contactId: 'c2', name: 'Bob Wilson', email: 'bob@acme.com', phone: '+1-555-0102' },
        ],
        aiScore: 85,
        warnings: 0,
        meddpiccScore: 78,
        lastActivity: '2026-05-28',
      },
      {
        dealId: 'deal-2',
        dealName: 'TechStart Inc - Pilot Program',
        amount: 45000,
        stage: 'Presentation Scheduled',
        pipeline: 'default',
        closeDate: '2026-07-01',
        createDate: '2026-04-15',
        ownerId: '1',
        ownerName: 'John Smith',
        forecastCategory: 'Most Likely',
        probability: 60,
        dealType: 'New Business',
        contacts: [
          { contactId: 'c3', name: 'Alice Johnson', email: 'alice@techstart.com', phone: '+1-555-0103' },
        ],
        aiScore: 72,
        warnings: 1,
        meddpiccScore: 65,
        lastActivity: '2026-05-25',
      },
      {
        dealId: 'deal-3',
        dealName: 'Global Solutions Ltd - Renewal',
        amount: 280000,
        stage: 'Closed Won',
        pipeline: 'sales',
        closeDate: '2026-05-20',
        createDate: '2026-01-10',
        ownerId: '2',
        ownerName: 'Sarah Chen',
        forecastCategory: 'Closed',
        probability: 100,
        dealType: 'Renewal',
        contacts: [
          { contactId: 'c4', name: 'David Brown', email: 'david@globalsolutions.com', phone: '+1-555-0104' },
          { contactId: 'c5', name: 'Emily Davis', email: 'emily@globalsolutions.com', phone: '+1-555-0105' },
          { contactId: 'c6', name: 'Frank Miller', email: 'frank@globalsolutions.com', phone: '+1-555-0106' },
        ],
        aiScore: 95,
        warnings: 0,
        meddpiccScore: 92,
        lastActivity: '2026-05-20',
      },
      {
        dealId: 'deal-4',
        dealName: 'MidMarket Co - Standard Package',
        amount: 60000,
        stage: 'Discovery',
        pipeline: 'default',
        closeDate: '',
        createDate: '2026-05-01',
        ownerId: '1',
        ownerName: 'John Smith',
        forecastCategory: 'Pipeline',
        probability: 20,
        dealType: 'New Business',
        contacts: [
          { contactId: 'c7', name: 'Sarah Wilson', email: 'sarah@midmarket.com', phone: '+1-555-0107' },
        ],
        aiScore: 45,
        warnings: 2,
        meddpiccScore: 40,
        lastActivity: '2026-05-26',
      },
      {
        dealId: 'deal-5',
        dealName: 'Northwest Health - Analytics Suite',
        amount: 115000,
        stage: 'Proposal',
        pipeline: 'sales',
        closeDate: '2026-06-30',
        createDate: '2026-02-20',
        ownerId: '2',
        ownerName: 'Sarah Chen',
        forecastCategory: 'Commit',
        probability: 75,
        dealType: 'New Business',
        contacts: [
          { contactId: 'c8', name: 'Michael Rodriguez', email: 'michael@nwhealth.com', phone: '+1-555-0108' },
          { contactId: 'c9', name: 'Lisa Garcia', email: 'lisa@nwhealth.com', phone: '+1-555-0109' },
        ],
        aiScore: 78,
        warnings: 1,
        meddpiccScore: 70,
        lastActivity: '2026-05-27',
      },
      {
        dealId: 'deal-6',
        dealName: 'BetaSoft - Expansion Deal',
        amount: 320000,
        stage: 'Decision Maker Bought-In',
        pipeline: 'default',
        closeDate: '2026-07-15',
        createDate: '2026-03-20',
        ownerId: '3',
        ownerName: 'Michael Rodriguez',
        forecastCategory: 'Most Likely',
        probability: 65,
        dealType: 'Expansion',
        contacts: [
          { contactId: 'c10', name: 'Tom Anderson', email: 'tom@betasoft.com', phone: '+1-555-0110' },
          { contactId: 'c11', name: 'Jennifer Lee', email: 'jen@betasoft.com', phone: '+1-555-0111' },
          { contactId: 'c12', name: 'Chris Taylor', email: 'chris@betasoft.com', phone: '+1-555-0112' },
        ],
        aiScore: 82,
        warnings: 0,
        meddpiccScore: 75,
        lastActivity: '2026-05-28',
      },
    ];

    // Return deals based on boardId
    if (boardId === '1') return baseDeals.filter(d => d.ownerId === '1');
    if (boardId === '2') return baseDeals.filter(d => d.pipeline === 'sales');
    if (boardId === '3') return baseDeals.filter(d => d.ownerId === '3');
    if (boardId === '4') return baseDeals.filter(d => d.amount > 100000);
    
    return baseDeals;
  }

  getAllMockDeals(): TransformedDeal[] {
    return this.getMockDeals('all');
  }

  getMockDealById(dealId: string): TransformedDeal | null {
    const allDeals = this.getAllMockDeals();
    return allDeals.find(d => d.dealId === dealId) || allDeals[0] || null;
  }
}
