// 1. app/api/notification/stream/route.js
// ==========================================
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    // Authenticate the user
    const { userId } = await auth(request);
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log(`🔗 SSE connection request from user: ${userId}`);

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Credentials': 'true'
    });

    // Create readable stream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        console.log(`📡 Starting SSE stream for user: ${userId}`);
        
        // Send initial connection message
        const connectionData = {
          id: `conn_${Date.now()}`,
          type: 'connection',
          title: 'Connected',
          message: 'Real-time notifications active',
          timestamp: new Date().toISOString(),
          read: false
        };
        
        const data = `data: ${JSON.stringify(connectionData)}\n\n`;
        controller.enqueue(encoder.encode(data));

        // Set up periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            // Send heartbeat comment (invisible to client)
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (error) {
            console.log(`💔 Heartbeat failed for user ${userId}:`, error.message);
            clearInterval(heartbeat);
          }
        }, 30000); // 30 seconds

        // Store connection globally for sending notifications
        if (!global.sseConnections) {
          global.sseConnections = new Map();
        }
        global.sseConnections.set(userId, controller);

        console.log(`✅ SSE connection established for user: ${userId}`);
        console.log(`📊 Total active SSE connections: ${global.sseConnections.size}`);

        // Cleanup on disconnect
        request.signal?.addEventListener('abort', () => {
          console.log(`🔌 SSE connection closed for user: ${userId}`);
          clearInterval(heartbeat);
          global.sseConnections?.delete(userId);
          
          try {
            controller.close();
          } catch (error) {
            // Connection already closed
            console.log(`⚠️ Controller already closed for user: ${userId}`);
          }
        });
      },
      
      cancel() {
        console.log(`❌ SSE stream cancelled for user: ${userId}`);
        global.sseConnections?.delete(userId);
      }
    });

    return new NextResponse(stream, { headers });

  } catch (error) {
    console.error('❌ SSE Stream error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}