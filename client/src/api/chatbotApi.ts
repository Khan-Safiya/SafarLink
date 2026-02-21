import axios from 'axios';
import type { Root } from '../types/chatbotRoute';
import type { AppAssistantResponse } from '../types/appAssistant';
import type { BookingRequest, BookingResult } from '../types/booking';

const chatbotAxios = axios.create({
  // baseURL: 'http://[IP_ADDRESS]',
  baseURL: 'http://localhost:8000',
});

/**
 * Send a natural-language travel query to the chatbot route agent.
 * Returns structured multi-modal transit route data.
 */
export async function fetchChatbotRoute(query: string): Promise<Root> {
  const response = await chatbotAxios.post<Root>('/agent', { query });
  return response.data;
}

/**
 * Send a question to the SafarLink App Assistant.
 * Answers app-related or travel-related questions; refuses off-topic queries.
 */
export async function fetchAppAssistant(query: string): Promise<AppAssistantResponse> {
  const response = await chatbotAxios.post<AppAssistantResponse>('/app-assistant', { query });
  return response.data;
}

/**
 * Book a multi-modal transit journey.
 * Returns a mock confirmed e-ticket with PNR and payment confirmation.
 */
export async function bookJourney(request: BookingRequest): Promise<BookingResult> {
  const response = await chatbotAxios.post<BookingResult>('/book', request);
  return response.data;
}
