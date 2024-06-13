import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchBar from './SearchBar';
import { fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import exp from 'constants';



describe('search bar', () => {

	let fetchMock: any = undefined;

	const assetsFetchMock = () => Promise.resolve({
		ok: true,
		status: 200,
		json: () => Promise.resolve({
			items: [
				{
					id: '1',
					volumeInfo: {
						title: 'Math book'
					}
				}, {
					id: '2',
					volumeInfo: {
						title: 'Math book 2'
					}
				}
			]
		}),
	}) as Promise<Response>;

	beforeEach(() => {
		fetchMock = jest.fn().mockImplementation(assetsFetchMock);
		global.fetch = fetchMock;
	});
	
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('render search bar', () => {
		render(<SearchBar />);
		const searchBar = screen.getByTestId('testid-search-bar');
		expect(searchBar).toBeInTheDocument();
	});

	it('render booklist when input changes', async () => {
		const { getByPlaceholderText } = render(<SearchBar />);
		const inputField = getByPlaceholderText('') as HTMLInputElement ;
		expect(inputField).toBeInTheDocument();
		fireEvent.change(inputField, { target: { value: 'math' }});
		expect(inputField.value).toBe('math');
		await waitFor(() => {expect(fetchMock).toHaveBeenCalledTimes(1);})
		await waitFor(() => {
			const bookList = screen.getByTestId('testid-booklist');
			expect(bookList).toBeInTheDocument();
			expect(bookList.children.length).toBeGreaterThan(0);
		});
	});
});
