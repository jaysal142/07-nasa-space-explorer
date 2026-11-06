// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// find the button and the gallery container
const button = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');

// find the modal and the parts inside it we will fill in
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// keeps the latest results so we can open the right one in the modal
let currentItems = [];

const spaceFacts = [
  'One day on Venus is longer than one year on Venus.',
  'Neutron stars are so dense that a teaspoon of one would weigh about a billion tons on Earth.',
  'The footprints left on the Moon by Apollo astronauts could last for millions of years.',
  'Jupiter\'s Great Red Spot is a storm bigger than Earth that has raged for centuries.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'Saturn is less dense than water, so it would float in a big enough bathtub.',
  'There are more stars in the universe than grains of sand on all of Earth\'s beaches.',
  'The International Space Station orbits Earth about 16 times every day.',
  'Olympus Mons on Mars is the tallest volcano in the solar system, about 2.5 times the height of Mount Everest.',
  'The first APOD was published on June 16, 1995.'
];

// pick a random fact each time the page loads
function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  document.getElementById('spaceFact').textContent = spaceFacts[randomIndex];
}

showRandomFact();

// new NASA endpoint want dates formatted as YYMMDD
// converts from YYYY-MM-DD to YYMMDD
function toNewDate(dateString) {
  return dateString.replaceAll('-', '').slice(2);
}

// When the button is clicked, fetch the images
button.addEventListener('click', getSpaceImages);

// make card for each entry and add to gallery
function displayGallery(items) {
  // save the items so the modal can find them later
  currentItems = items;

  // show a friendly message if NASA returned nothing for these dates
  if (items.length === 0) {
    gallery.innerHTML = `<div class="placeholder"><p>No space photos found for those dates. Try another range!</p></div>`;
    return;
  }

  let html = '';

  // index tells us which item was clicked when we open the modal
  items.forEach((item, index) => {
    if (item.media_type === 'image') {
      html += `
        <div class="gallery-item" data-index="${index}" tabindex="0">
          <div class="image-wrap">
            <img src="${item.hdurl}" alt="${item.title}" loading="lazy" />
          </div>
          <p class="item-title">${item.title}</p>
          <p class="item-date">${item.date}</p>
        </div>`;
    }
    else {
      // video entries get a clear video label and play icon
      html += `
        <div class="gallery-item" data-index="${index}" tabindex="0">
          <div class="image-wrap video-thumb">
            <img src="${item.hdurl}" alt="${item.title}" loading="lazy" />
            <span class="play-icon">▶</span>
          </div>
          <p class="item-title">${item.title} <span class="video-badge">Video</span></p>
          <p class="item-date">${item.date}</p>
        </div>`;
    }
  });

  // add all cards to page
  gallery.innerHTML = html;

  // make every card open the modal when clicked (or when Enter is pressed)
  const cards = document.querySelectorAll('.gallery-item');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      openModal(currentItems[card.dataset.index]);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        openModal(currentItems[card.dataset.index]);
      }
    });
  });
}

// ask NASA API for images in selected date range
async function getSpaceImages() {
  // read user picked dates
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Build request URL with template literals
  const url = `https://science.nasa.gov/wp-json/wp/v2/apod-basic/?date_from=${toNewDate(startDate)}&date_to=${toNewDate(endDate)}`;

  // show a loading message until the data arrives
  gallery.innerHTML = `<div class="placeholder"><div class="placeholder-icon">🔄</div><p>Loading space photos…</p></div>`;

  try {
    // send request and wait for response
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }
    //turn response into js data array
    const data = await response.json();
    console.log(data);
    // show imgs on page (replaces the loading message)
    displayGallery(data);
  }
  catch (error) {
    console.error(error);
    gallery.innerHTML = `<div class="placeholder"><p>Something went wrong. Please try again.</p></div>`;
  }
}

// fill the modal with one APOD entry and show it
function openModal(item) {
  if (item.media_type === 'image') {
    // larger version of the image
    modalMedia.innerHTML = `<img src="${item.hdurl}" alt="${item.title}" />`;
  }
  else {
    // videos play on NASAs page for that day, so link to it
    modalMedia.innerHTML = `
      <a class="video-link" href="${item.url}" target="_blank" rel="noopener">
        ▶ Watch this video on NASA's website
      </a>`;
  }

  modalTitle.innerHTML = item.title;
  modalDate.textContent = item.date;

  // NASAs explanation contains HTML links, use innerHTML
  modalExplanation.innerHTML = item.explanation.split('<br><br><br><strong>Tomorrow')[0];

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open'); // stop the page behind from scrolling
  modalClose.focus();
}

// hide the modal
function closeModal() {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

// three ways to close: the X button, clicking the dark background, or pressing Escape
modalClose.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  // only close if the dark background itself was clicked, not the content box
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});
