const mongoose  = require('mongoose');

const TaskSchema = new mongoose.Schema({
    tasks: Array,
  });
 module.exports = mongoose.model('assignment_shubham', TaskSchema);