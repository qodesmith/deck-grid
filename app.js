// Object for tracking pieces to save and other things.
var tracker = {squares: [], lengthMoving: false, objectMoving: false, listeners: {}};

// Object for tracking pieces for multiple draws.
// Hold down the alt / option key, and click 2 points on the board.
var alt = {pieces: []};


// Save our current layout to a text file.
function saveLayout() { // http://goo.gl/DwUxmp
  var textFile = null;
  var makeTextFile = function(text) {
    var data = new Blob([text], {type: 'text/plain'});

    if(textFile !== null) window.URL.revokeObjectURL(textFile);

    textFile = window.URL.createObjectURL(data);

    return textFile;
  }

  tracker.listeners.saveClick = function(e) {
    // Scope this listener to just the save button.
    if(e.target.id !== 'save-button') return;

    // Store all length pieces.
    var lengthsObj = {lengths: []};
    var lengths = document.querySelectorAll('.length');
    for(var j = 0; j < lengths.length; j++) {
      lengthsObj.lengths.push(lengths[j].outerHTML);
    }

    // Store all objects.
    var objectsObj = {objects: []};
    var objects = document.querySelectorAll('.object');
    for(var k = 0; k < objects.length; k++) {
      objectsObj.objects.push(objects[k].outerHTML);
    }

    // Clean up the 'tracker.squares' array.
    var tempArray = [];
    for(var i = 0; i < tracker.squares.length; i++) {
      if(tracker.squares[i] !== null) tempArray.push(tracker.squares[i]);
    }

    tempArray.push(lengthsObj);
    tempArray.push(objectsObj);

    // Contents of the file.
    var layout = JSON.stringify(tempArray);

    // Hide the save button.
    save.style.display = 'none';

    // Show the download button
    var link = document.querySelector('#download-link');
    link.href = makeTextFile(layout);
    link.style.display = 'block';
  };
  document.body.addEventListener('click', tracker.listeners.saveClick, false);
}

// Process individual squares.
function processSquare(el) {
  if(el.classList.contains('structure')) return;

  var row = Number(el.dataset.row); // Row.
  var col = Number(el.dataset.col);// Column.
  var type = tracker.legend.id; // New type of piece.
  var piece = {row: row, col: col, type: type}; // Piece for the tracker array.

  // Occupied squares...
  if(el.dataset.index) {
    var oldIndex = Number(el.dataset.index);
    tracker.squares.splice(oldIndex, 1);

    el.classList.remove(el.dataset.type); // Remove old type class.
    el.classList.add(type); // Set new type class.
    el.dataset.type = type; // Set stored type.

    // Insert the new piece into array at the old index.
    tracker.squares.splice(oldIndex, 0, piece);

  // Empty squares...
  } else {
    el.classList.add(type); // Set new type class.
    el.dataset.type = type; // Set stored type.
    el.dataset.index = tracker.squares.length; // Store the items index # in the array.

    // Add new piece to the tracker array.
    tracker.squares.push(piece);
  }
}

// Draw a deck from a supplied array (saved file).
function drawDeck(array) {
  var body = document.querySelector('body');

  for(var i = 0; i < array.length; i++) {
    var item = array[i];
    // If we hit the 'lengths' item array, draw them all on the board.
    if(item.lengths) {
      for(var j = 0; j < item.lengths.length; j++) {
        var div = document.createElement('div');
        div.innerHTML = item.lengths[j];
        body.appendChild(div.firstChild);
      }

    // If we hit the 'objects' item array, draw them all on the board.
    } else if(item.objects) {
      for(var k = 0; k < item.objects.length; k++) {
        var div = document.createElement('div');
        div.innerHTML = item.objects[k];
        body.appendChild(div.firstChild);
      }
    } else {
      var square = document.querySelector('.row' + item.row + '.col' + item.col);

      square.classList.add(item.type);
      square.dataset.type = item.type;
      square.dataset.index = i;

      tracker.squares.push(item);
    }
  }
}

// Clear the board.
function clearBoard() {
  var objects = document.querySelectorAll('.object');
  var lengths = document.querySelectorAll('.length');
  var squares = document.querySelectorAll('.square');

  // Remove all objects.
  if(objects.length) {
    for(var i = 0; i < objects.length; i++) {
      objects[i].remove();
    }
  }

  // Remove all lengths.
  if(lengths.length) {
    for(var j = 0; j < lengths.length; j++) {
      lengths[j].remove();
    }
  }

  // Reset all squares.
  for(var k = 0; k < squares.length; k++) {
    if(squares[k].classList.contains('structure')) continue;
    squares[k].classList.remove('pole', 'beam-top', 'beam-bottom', 'double-top', 'double-beam', 'double-bottom');
    squares[k].removeAttribute('data-type');
    squares[k].removeAttribute('data-index');
  }

  // Clear the tracker object.
  tracker.squares.length = 0;
}


/////////////////////
// EVENT LISTENERS //
/////////////////////

// Alt & Enter keys.
// Hold down the alt / option key, and click 2 points on the board.
tracker.listeners.keydown = function(e) {
  if(e.which === 18) alt.key = true;

  // Enter key for create modals.
  if(e.which === 13) {
    if(tracker.legend && tracker.legend.id === 'create-object') {
      document.querySelector('#create-obj').click();
    } else if(tracker.legend && tracker.legend.id === 'create-length') {
      document.querySelector('#create-len').click();
    }
  }
};
document.body.addEventListener('keydown', tracker.listeners.keydown);

tracker.listeners.keyup = function(e) {
  alt.pieces.length = 0; // Clear the alt-tracked pieces.
  if(e.which === 18) alt.key = false;
};
document.body.addEventListener('keyup', tracker.listeners.keyup);

// Mouse-move for length & object pieces.
tracker.listeners.mousemove = function(e) {
  if(tracker.lengthMoving) {
    var el = tracker.movingEl;
  } else if(tracker.objectMoving) {
    var el = tracker.movingObj;
  } else return;

  // Must use 'pageX' & 'pageY' to account for screen scrolling.
  el.style.top = e.pageY + 'px';
  el.style.left = e.pageX + 'px';
};
document.body.addEventListener('mousemove', tracker.listeners.mousemove);

// Import file.
tracker.listeners.change = function(e) {
  if(e.target.id !== 'import') return;

  var input = e.target;
  var textarea = document.querySelector('#paste-JSON');
  var error = document.querySelector('#load-error');

  // File reader stuffs: http://goo.gl/oJ54hU
  var file = input.files[0];
  var textType = /text.*/; // Text files only.

  if(file && file.type.match(textType)) {
    var reader = new FileReader();
    reader.onload = function(e) {
      textarea.value = ''; // Clear the textarea.
      textarea.value = reader.result; // Clear the file input field.
    }

    reader.readAsText(file);

  } else if(file) {
    error.innerText = 'Text files only please.';
  }
};
document.body.addEventListener('change', tracker.listeners.change);

// Clicks.
tracker.listeners.click = function(e) {
  // LEGEND ITEMS
  if(e.target.classList.contains('legend-item')) {
    // If there's a current legend item, remove its class.
    if(tracker.legend) {
      tracker.legend.classList.remove('current-item');
    }

    // Store the current legend item.
    tracker.legend = e.target;
    e.target.classList.add('current-item');

    // Open SAVE modal.
    if(e.target.id === 'save-layout') {
      document.querySelector('#save-modal').style.display = 'initial';
      document.querySelector('#view-JSON').value = JSON.stringify(tracker.squares);

    // Open LOAD modal.
    } else if(e.target.id === 'load-layout') {
      document.querySelector('#load-modal').style.display = 'initial';

    // Open CREATE-LENGTH modal.
    } else if(e.target.id === 'create-length') {
      document.querySelector('#create-length-modal').style.display = 'initial';

    // Open CREATE-OBJ modal.
    } else if(e.target.id === 'create-object') {
      document.querySelector('#create-obj-modal').style.display = 'initial';
    }

  // SQUARE
  } else if(e.target.classList.contains('square')) {
    // Do nothing for squares we can't draw on and non-drawing legend options.
    if(e.target.classList.contains('structure')) return e.stopPropagation();
    if(tracker.legend && tracker.legend.id.includes('create')) return e.stopPropagation();
    if(tracker.legend && tracker.legend.id.includes('layout')) return e.stopPropagation();

    // If we have a legend item selected...
    if(tracker.legend) {

      if(tracker.legend.id === 'reset') {

        // Replace piece from the 'tracker.squares' array with null.
        if(e.target.dataset.index) { // Prevent empty squares from triggering the splice.
          tracker.squares.splice(e.target.dataset.index, 1, null);
          e.target.classList.remove(e.target.dataset.type); // Remove type class.
          e.target.removeAttribute('data-type'); // Remove stored type.
        }
      } else if(tracker.legend.id === 'delete') {
        // Prevent the 'delete' class from being added to quares.
        return e.stopPropagation();

      } else {

        // ALT-KEY
        if(alt.key === true) {
          // Push the starting piece.
          if(alt.pieces.length === 0) {
            alt.pieces.push(e.target);

          // Push the ending piece, draw multiple things.
          } else if(alt.pieces.length === 1) {
            alt.pieces.push(e.target);

            // Row or column? / Ascending or descending?
            var fillObj = (function rowOrCol() {
              var obj = {};
              var piece1 = alt.pieces[0];
              var piece2 = alt.pieces[1];

              // Row or column?
              if(piece1.dataset.row === piece2.dataset.row) {
                obj.type = 'col'; // Type to process.
                obj.row = piece1.dataset.row; // Stays consistent.
              } else {
                obj.type = 'row'; // Type to process.
                obj.col = piece1.dataset.col; // Stays consistent.
              }

              // Are we ascending or descending?
              if(Number(piece1.dataset[obj.type]) < Number(piece2.dataset[obj.type])) {
                obj.start = Number(piece1.dataset[obj.type]);
                obj.end = Number(piece2.dataset[obj.type]);
              } else {
                obj.start = Number(piece2.dataset[obj.type]);
                obj.end = Number(piece1.dataset[obj.type]);
              }

              return obj;
            })();

            // Fill.
            for(var i = fillObj.start; i <= fillObj.end; i++) {
              if(fillObj.type === 'row') {
                var square = document.querySelector('.row' + i + '.col' + fillObj.col);
              } else {
                var square = document.querySelector('.col' + i + '.row' + fillObj.row);
              }

              processSquare(square);
            }

            // Clear the alt-tracked pieces.
            alt.pieces.length = 0;
          }

        // NO ALT-KEY
        } else {
          alt.pieces.length = 0; // Clear the alt-tracked pieces.
          processSquare(e.target);
        }
      }
    }

  // MODAL CLOSE
  } else if(e.target.classList.contains('modal-close')) {
    var modal = e.target.parentElement.parentElement;

    // Close SAVE modal.
    if(modal.id === 'save-modal') {
      modal.style.display = 'none';

      // Reset the save button & download link.
      document.querySelector('#save-button').style.display = 'block';
      document.querySelector('#download-link').style.display = 'none';

    // Close LOAD modal.
    } else if(modal.id === 'load-modal') {
      modal.style.display = 'none';

      document.querySelector('#paste-JSON').value = '';
      document.querySelector('#import').value = ''; // Invisible file-input.

    // Close LENGTH modal.
    } else if(modal.id === 'create-length-modal') {
      // Clear all values.
      document.querySelector('#length-feet').value = '';
      document.querySelector('#length-inches').value = '';
      document.querySelector('#error').innerText = '';
      document.querySelector('input[name="direction"]').checked = true;
      modal.style.display = 'none';

    // Close OBJECT modal.
    } else if(modal.id === 'create-obj-modal') {
      // Clear all values.
      document.querySelector('#obj-length-feet').value = '';
      document.querySelector('#obj-length-inches').value = '';
      document.querySelector('#obj-width-feet').value = '';
      document.querySelector('#obj-width-inches').value = '';
      modal.style.display = 'none';
    }

  // Import-button
  } else if(e.target.id === 'import-button') {
    document.querySelector('#paste-JSON').value = '';
    document.querySelector('#load-error').innerText = '';
    document.querySelector('#import').click();

  // Load-button / draw deck.
  } else if(e.target.id === 'load') {
    var textarea = document.querySelector('#paste-JSON');
    if(textarea === '') return e.stopPropagation();

    var text = JSON.parse(textarea.value);
    document.querySelector('.load-layout-modal-bg').style.display = 'none';

    clearBoard();
    drawDeck(text);

  // Create-button (length).
  } else if(e.target.id === 'create-len') {
    var radioValue = document.querySelector('input[name="direction"]:checked').value;
    var feet = Number(document.querySelector('#length-feet').value);
    var inches = Number(document.querySelector('#length-inches').value);
    var error = document.querySelector('#error');

    if(feet === '') feet = 0;
    if(inches === '') inches = 0;

    // Errors.
    if(feet > 21 || feet < 0) {
      return error.innerText = "Feet must be between 0 and 21.";
    } else if(inches > 11 || inches < 0) {
      return error.innerText = "Inches must be between 0 and 11.";
    } else {
      // squares are 16px l & w.

      var totalF = 3 * 16 * feet;
      var totalI = 4 * inches;
      var div = document.createElement('div');

      if(radioValue === 'vertical') div.classList.add('vertical');
      div.classList.add('length');
      div.style.width = totalF + totalI + 'px';
      div.innerText = feet + '\' ' + inches + '"';

      document.querySelector('body').appendChild(div);
    }

    // Clear all values.
    document.querySelector('#length-feet').value = '';
    document.querySelector('#length-inches').value = '';
    document.querySelector('#error').innerText = '';

    document.querySelector('.create-length-modal-bg').style.display = 'none';

  // Create-button (object).
  } else if(e.target.id === 'create-obj') {
    var feetLength = Number(document.querySelector('#obj-length-feet').value);
    var inchesLength = Number(document.querySelector('#obj-length-inches').value);
    var feetWidth = Number(document.querySelector('#obj-width-feet').value);
    var inchesWidth = Number(document.querySelector('#obj-width-inches').value);

    if(feetLength === '') feetLength = 0;
    if(inchesLength === '') inchesLength = 0;
    if(feetWidth === '') feetWidth = 0;
    if(inchesWidth === '') inchesWidth = 0;

    var div = document.createElement('div');
    var span1 = document.createElement('span');
    var span2 = document.createElement('span');

    div.classList.add('object');
    span1.innerText = 'Length: ' + feetLength + '\'' + inchesLength + '"';
    span2.innerText = 'Width: ' + feetWidth + '\'' + inchesWidth + '"';

    div.appendChild(span1);
    div.appendChild(span2);

    div.style.width = ((16 * 3) * feetLength) + (4 * inchesLength) + 'px';
    div.style.height = ((16 * 3) * feetWidth) + (4 * inchesWidth) + 'px';

    document.querySelector('body').appendChild(div);
    document.querySelector('.create-obj-modal-bg').style.display = 'none';

    // Clear all values.
    document.querySelector('#obj-length-feet').value = '';
    document.querySelector('#obj-length-inches').value = '';
    document.querySelector('#obj-width-feet').value = '';
    document.querySelector('#obj-width-inches').value = '';

  // LENGTH
  } else if(e.target.classList.contains('length')) {
    // Remove-length logic.
    if(tracker.legend.id === 'delete') {
      return e.target.remove();
    }

    tracker.lengthMoving = !tracker.lengthMoving;

    if(tracker.lengthMoving) {
      tracker.movingEl = e.target;
    } else {
      tracker.movingEl = '';
    }

  // OBJECT
  } else if(e.target.classList.contains('object')) {
    // Remove-object logic.
    if(tracker.legend.id === 'delete') {
      return e.target.remove();
    }

    tracker.objectMoving = !tracker.objectMoving;

    if(tracker.objectMoving) {
      tracker.movingObj = e.target;
    } else {
      tracker.movingObj = '';
    }
  }

  e.stopPropagation();
};
document.body.addEventListener('click', tracker.listeners.click);

//////////////////////
// CREATE THE BOARD //
//////////////////////

var row = 1;
var col = 1;
var grid = document.querySelector('.grid');

for(var i = 0; i < 6400; i++) {
  var square = document.createElement('div')
  square.className = 'square';

  // House.
  if(col > 12 && col < 73 && row < 6) square.classList.add('house', 'structure');

  // Chimney.
  if(col > 40 && col < 45 && row > 5 && row < 9) square.classList.add('house', 'structure');

  // Garage.
  if(col < 62 && row > 67) square.classList.add('garage', 'structure');

  // Neighbor's yard.
  if(col < 13 && row < 6) square.classList.add('neighbor', 'structure');
  if(col < 8 && row > 5 && row < 68) square.classList.add('neighbor', 'structure');

  // Grass.
  if(col > 72 & row < 68) square.classList.add('grass', 'structure');

  square.classList.add('row' + row);
  square.classList.add('col' + col);
  square.dataset.row = row;
  square.dataset.col = col;

  col++;
  if(col === 81) col = 1, row++;

  grid.appendChild(square);
}

// Process the few angled-grass pieces.
(function processGrassAngles() {
  // Angles
  var rows = [67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57];
  var cols = [62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72];

  for(var i = 0; i < rows.length; i++) {
    var angle = document.querySelector('.row' + rows[i] + '.col' + cols[i]);
    angle.classList.add('angle', 'structure');
  }
})();

// Fill angle-grass section.
(function angleGrassSection() {
  var row = 58;
  var col = [72];
  var times = 10;

  for(i = 0; i < col.length; i++) {
    var square = document.querySelector('.row' + row + '.col' + col[i]);
    square.classList.add('grass', 'structure');

    if(i === col.length - 1) {
      col.push(col[i] - 1);
      row++;
      i = -1;
      times--;
    }

    if(times === 0) break;
  }
})();

// Default radio button value.
document.querySelector('input[name="direction"]').checked = true;

saveLayout();