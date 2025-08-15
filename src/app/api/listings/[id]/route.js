import { NextResponse } from 'next/server';
import FoodListing from '@/models/FoodListing';
import { connectDB } from '@/lib/db'; // Assuming this connects to MongoDB

export async function GET(request, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const listing = await FoodListing.findById(id);

    if (!listing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ message: 'Error fetching listing', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  await connectDB();
  try {
    const { id } = params;
    const body = await request.json();

    const updatedListing = await FoodListing.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updatedListing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json({ message: 'Error updating listing', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await connectDB();
  try {
    const { id } = params;

    const deletedListing = await FoodListing.findByIdAndDelete(id);

    if (!deletedListing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ message: 'Error deleting listing', error: error.message }, { status: 500 });
  }
}
