import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	googleGeocode,
	googlePlacesAutocomplete,
	bingGeocode,
	bingAutoSuggestPlaces,
	fetchAutocompleteResults
} from '../../lib/geocoder.js';

const apiKey = 'TEST';
describe('googleGeocode', () => {
	const query = 'Space Needle, Seattle';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('returns geocoding result on valid response', async () => {
		const fakeResponse = {
			status: 'OK',
			results: [
				{
					geometry: { location: { lat: 47.6205, lng: -122.3493 } },
					formatted_address: 'Space Needle, Seattle, WA'
				}
			]
		};

		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const result = await googleGeocode({ apiKey, query });
		expect(result).toEqual({
			name: 'Space Needle, Seattle, WA',
			formatted_address: 'Space Needle, Seattle, WA',
			geometry: { location: { lat: 47.6205, lng: -122.3493 } }
		});
	});

	it('returns null when response status is not OK or results are empty', async () => {
		const fakeResponse = { status: 'Golang is the best', results: [] };
		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const result = await googleGeocode({ apiKey, query });
		expect(result).toBeNull();
	});
});

describe('googlePlacesAutocomplete', () => {
	const input = 'Space Needle';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('returns empty array when suggestions are missing', async () => {
		const fakeResponse = {};
		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const results = await googlePlacesAutocomplete({ apiKey, input });
		expect(results).toEqual([]);
	});

	it('returns suggestions when valid response', async () => {
		const fakeResponse = {
			suggestions: [
				{
					placePrediction: {
						placeId: '123',
						text: { text: 'Space Needle, Seattle, WA' }
					}
				}
			]
		};
		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const results = await googlePlacesAutocomplete({ apiKey, input });
		expect(results).toEqual([
			{
				placeId: '123',
				name: 'Space Needle, Seattle, WA',
				displayText: 'Space Needle, Seattle, WA'
			}
		]);
	});
});

describe('bingGeocode', () => {
	const query = 'Space Needle, Seattle';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('returns geocoding result on valid response', async () => {
		const fakeResponse = {
			resourceSets: [
				{
					estimatedTotal: 1,
					resources: [
						{
							point: { coordinates: [47.6205, -122.3493] },
							address: { formattedAddress: 'Space Needle, Seattle, WA' },
							name: 'Space Needle'
						}
					]
				}
			]
		};

		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const result = await bingGeocode({ apiKey, query });
		expect(result).toEqual({
			name: 'Space Needle',
			formatted_address: 'Space Needle, Seattle, WA',
			geometry: { location: { lat: 47.6205, lng: -122.3493 } }
		});
	});

	it('returns null when estimatedTotal is 0', async () => {
		const fakeResponse = {
			resourceSets: [{ estimatedTotal: 0, resources: [] }]
		};

		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const result = await bingGeocode({ apiKey, query });
		expect(result).toBeNull();
	});
});

describe('bingAutoSuggestPlaces', () => {
	const query = 'Space Needle';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('returns empty array when resourceSets are missing or empty', async () => {
		const fakeResponse = { resourceSets: [] };
		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const results = await bingAutoSuggestPlaces({ apiKey, query });
		expect(results).toEqual([]);
	});

	it('returns empty array when resources are missing', async () => {
		const fakeResponse = { resourceSets: [{ estimatedTotal: 1, resources: [] }] };
		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const results = await bingAutoSuggestPlaces({ apiKey, query });
		expect(results).toEqual([]);
	});

	it('returns suggestions for resources with a value array', async () => {
		const fakeResponse = {
			resourceSets: [
				{
					estimatedTotal: 1,
					resources: [
						{
							value: [
								{
									name: 'Space Needle',
									address: { formattedAddress: 'Space Needle, Seattle, WA' }
								}
							]
						}
					]
				}
			]
		};

		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const results = await bingAutoSuggestPlaces({ apiKey, query });
		expect(results).toEqual([
			{
				name: 'Space Needle',
				displayText: 'Space Needle - Space Needle, Seattle, WA'
			}
		]);
	});
});

describe('fetchAutocompleteResults', () => {
	const query = 'Space Needle';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('delegates to googlePlacesAutocomplete for provider "google"', async () => {
		const fakeResponse = {
			suggestions: [
				{
					placePrediction: {
						placeId: 'abc',
						text: { text: 'Space Needle, Seattle, WA' }
					}
				}
			]
		};
		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const results = await fetchAutocompleteResults('google', query, apiKey);
		expect(results).toEqual([
			{
				placeId: 'abc',
				name: 'Space Needle, Seattle, WA',
				displayText: 'Space Needle, Seattle, WA'
			}
		]);
	});

	it('delegates to bingAutoSuggestPlaces for provider "bing"', async () => {
		const fakeResponse = {
			resourceSets: [
				{
					estimatedTotal: 1,
					resources: [
						{
							name: 'Space Needle',
							address: { formattedAddress: 'Space Needle, Seattle, WA' }
						}
					]
				}
			]
		};
		global.fetch.mockResolvedValue({
			json: async () => fakeResponse
		});

		const results = await fetchAutocompleteResults('bing', query, apiKey);
		expect(results).toEqual([
			{
				name: 'Space Needle',
				displayText: 'Space Needle, Seattle, WA'
			}
		]);
	});

	it('throws error for invalid provider', async () => {
		await expect(fetchAutocompleteResults('invalid', query, apiKey)).rejects.toThrow(
			'Invalid geocoding provider'
		);
	});
});
