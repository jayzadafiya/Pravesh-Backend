export interface ITicketType {
  type: string;
  price: number;
  quantity: number;
}

export interface IVenueTicket extends Document {
  eventTicket: string;
  venue: string;
  address: string;
  date: Date;
  ticketTypes: ITicketType[];
  createdAt: Date;
  updatedAt: Date;
}
