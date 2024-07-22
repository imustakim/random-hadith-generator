// List of allowed English editions
const allowedEditions = [
    'eng-bukhari',
    'eng-muslim',
    'eng-nasai',
    'eng-abudawud',
    'eng-tirmidhi',
    'eng-ibnmajah',
    'eng-malik'
];

// Function to pick a random element from an array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Function to fetch metadata
async function fetchMetadata(edition) {
    try {
        const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}.json`);
        if (!response.ok) throw new Error('Failed to load volume data');
        return await response.json();
    } catch (error) {
        throw new Error('Failed to fetch metadata: ' + error.message);
    }
}

// Function to get sections from metadata
function getSectionsFromMetadata(metadata) {
    if (!metadata || !metadata.metadata || !metadata.metadata.sections) {
        throw new Error('No valid sections found');
    }
    return Object.entries(metadata.metadata.sections).map(([number, title]) => ({ number, title }));
}

// Function to fetch section data
async function fetchSectionData(edition, sectionNumber) {
    try {
        const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}/sections/${sectionNumber}.json`);
        if (!response.ok) throw new Error('Failed to load section data');
        return await response.json();
    } catch (error) {
        throw new Error('Failed to fetch section data: ' + error.message);
    }
}

// Function to update the HTML content
function updateHTML(hadith, section, bookName) {
    document.getElementById('hadith-text').innerText = hadith.text || 'Hadith text not available';
    document.getElementById('details').innerHTML = `
        <p>Book Name: ${bookName}</p>
        <p>Section Number: ${section.number}</p>
        <p>Section Title: ${section.title}</p>
        <p>Hadith Number: ${hadith.hadithnumber || 'N/A'}</p>
    `;
}

// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to apply a random gradient to the background
function applyRandomGradient() {
    const color1 = getRandomColor();
    const color2 = getRandomColor();
    const gradient = `linear-gradient(to right, ${color1}, ${color2})`;
    document.body.style.background = gradient;
}

// Main function to fetch and display a random Hadith
async function fetchRandomHadith() {
    try {
        const edition = getRandomElement(allowedEditions);
        const metadata = await fetchMetadata(edition);
        const sections = getSectionsFromMetadata(metadata);

        if (sections.length === 0) throw new Error('No sections found');
        
        const randomSection = getRandomElement(sections);
        const sectionData = await fetchSectionData(edition, randomSection.number);
        const hadiths = sectionData.hadiths || [];
        
        if (hadiths.length === 0) throw new Error('No Hadiths found in the section');

        const randomHadith = getRandomElement(hadiths);
        updateHTML(randomHadith, randomSection, metadata.metadata.name);

    } catch (error) {
        console.error('Failed to load Hadith data:', error);
        document.getElementById('hadith-text').innerText = 'Failed to load Hadith data. Please try again later.';
        document.getElementById('details').innerHTML = '';
    }
}

// Initial call to apply random gradient and fetch and display a random Hadith
applyRandomGradient();
fetchRandomHadith();
