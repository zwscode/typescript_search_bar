import React from 'react'
import { useState } from 'react'
import debounce from '../../utils/debounce';
import './SearchBar.css'


interface BookInfo {
	id: string;
	title: string;
}

const SearchBar:React.FC = () => {

	const [input, setInput] = useState<string>('');
	const [bookList, setBookList] = useState<BookInfo[]>([]);

	const fetchBookOptions = async (queryName: string) => {
		try {
			const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${queryName}&startIndex=0&maxResults=5`);
			
			if (!response) {
				throw new Error('response not ok');
			}
			const data = await response.json();
			if (!data) {
				throw new Error('no items found');
			}
			const dataBooks = data.items.map((item: any) => {
				return {id: item.id, 
					title: 
					item.volumeInfo.title
				};
			})
			setBookList(dataBooks);
		} catch (error) {
			console.log("error fetching data", error);
		}
		
	}

	const debouncedFetchBookOptions = debounce(fetchBookOptions, 300);
	const debouncedClearBookList = debounce(() => setBookList([]), 300);

	const handleInputChange = (event: any) => {
		const inputContent = event.target.value;
		setInput(inputContent);

		if (inputContent !== "") {
			debouncedFetchBookOptions(inputContent);
		} else {
			debouncedClearBookList();
		}
	}


	return (
	<div className="search-bar">
		<input type="text" placeholder={input} list="booklist" className="search-input" onChange={handleInputChange} data-testid="testid-search-bar"/>
		
		{bookList.length > 0 ? (<datalist id="booklist" data-testid="testid-booklist">
			{bookList.map((bookInfo) => {
				return <option key={bookInfo.id} value={bookInfo.title}/>
			})}
		</datalist>): null}
	</div>
  )
}

export default SearchBar