import mongoose, { Schema, Document, Model, Types, CallbackError, HydratedDocument } from 'mongoose';
import Event from './event.model';

/**
 * TypeScript interface representing a Booking document
 */
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking, Model<IBooking>>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook to verify that the referenced event exists
 */
BookingSchema.pre('save', async function (this: HydratedDocument<IBooking>) {
  // Only validate eventId if it's new or has been modified
  if (this.isNew || this.isModified('eventId')) {
    // Dynamically import Event model to avoid circular dependency
    const Event = mongoose.models.Event || (await import('./event.model')).default;
    
    const eventExists = await Event.exists({ _id: this.eventId });
    
    if (!eventExists) {
      throw new Error('Referenced event does not exist');
    }
  }
});

// Create index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

// Prevent model overwrite during hot reload in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
