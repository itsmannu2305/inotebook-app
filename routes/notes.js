const express = require("express");
const router = express.Router();
const Notes = require("../models/Notes");
const { body, validationResult } = require("express-validator");
const fetchuser = require("../middleware/fetchuser");

//ROUTES 1: Fetch all notes using: GET '/api/notes/fetchallnotes'. Login required.
router.get("/fetchallnotes", fetchuser, async (req, res) => {
  const notes = await Notes.find({ user: req.user.id });
  res.json(notes);
});

//ROUTES 2: Add a new note using: POST '/api/notes/addnotes'. Login required.
router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Title must be atleast 5 characters").isLength({ min: 5 }),
    body("description", "description must be atleast 8 characters").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;
      //Check if some error then response bad message
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const notes = new Notes({ title, description, tag, user: req.user.id });
      const saveNote = await notes.save();
      res.json(saveNote);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//ROUTES 3: Update a existing note using: PUT '/api/notes/updatenote'. Login required.
router.put("/updatenote/:id", fetchuser, async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    //Create a newNote object
    const newNote = {};
    if (title) {
      newNote.title = title;
    }
    if (description) {
      newNote.description = description;
    }
    if (tag) {
      newNote.tag = tag;
    }

    // Find the note to be updated to upadte
    let note = await Notes.findById(req.params.id);
    if (!note) {
      return res.status(404).send("Not Found");
    }
    // Allow to update if user own this note
    if (note.user.toString() !== req.user.id) {
      return res.status(404).send("Not Allowed");
    }
    note = await Notes.findByIdAndUpdate(
      req.params.id,
      { $set: newNote },
      { new: true }
    );
    res.json({ note });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//ROUTES 4: Delete a existing note using: DELETE '/api/notes/deletenote'. Login required.
router.delete("/deletenote/:id", fetchuser, async (req, res) => {
  try {
    // const { title, description, tag } = req.body;

    // Find the note to be deleted to delete
    let note = await Notes.findById(req.params.id);
    if (!note) {
      return res.status(404).send("Not Found");
    }
    // Allow to deletion if user own this note
    if (note.user.toString() !== req.user.id) {
      return res.status(404).send("Not Allowed");
    }
    note = await Notes.findByIdAndDelete(req.params.id);
    res.json({ Successed: "Note Delete Successfully", note: note });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
