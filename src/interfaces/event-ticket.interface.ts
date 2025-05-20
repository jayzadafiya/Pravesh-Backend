export interface IEventTicket extends Document {
  event: string;
  generalPrice: number;
  generalQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}
