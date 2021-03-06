 /*global AudioContext:true, webkitAudioContext:true*/

$(function($) {
  // Everything should be loaded now
  var dataflow = new Dataflow();
  window.dataflow = dataflow;

  // Setup audio context
  var context;
  if (typeof AudioContext !== "undefined") {
    try {
      context = new AudioContext();
    } catch (e) {
      window.alert("Your browser has ran out of usable WebAudio contexts. Close some pages which use WebAudio and reload.");
      throw new Error('Unable to instantiate AudioContext');
    }
  } else {
    window.alert("WebAudio isn't supported in this browser yet :-(");
    throw new Error('AudioContext not supported. :(');
  }
  dataflow.audioContext = context;
  // Can listen to this for node setup that needs dataflow.audioContext to be ready
  dataflow.trigger("audioContextReady", dataflow);

  // Refresh library
  dataflow.plugins.library.update({exclude:["test", "base", "base-resizable", "audio-base", "dataflow-input", "dataflow-output", "dataflow-subgraph"]});

  // Dis/connect events
  dataflow.on("edge:add", function(graph, edge){
    // Connect
    if (edge.source.get("type") === "audio") {
      var sourceOut = edge.source.parentNode.audioOutput;
      var targetIn = edge.target.parentNode.audioInput;
      var targetOut = edge.target.parentNode.audioOutput;
      if (edge.target.get("type") === "audio" && sourceOut && targetIn) {
        sourceOut.connect(targetIn);
      } else if (edge.target.get("automatable") === true && sourceOut && targetOut) {
        // Connect audio to automatable AudioParam
        sourceOut.connect(targetOut[edge.target.id]);
      } else {
        dataflow.log("do those connect?");
      }
    }
  });

  dataflow.on("edge:remove", function(graph, edge){
    // Disconnect
    if (edge.source.get("type") === "audio" && edge.target.get("type") === "audio") {
      if (edge.source.parentNode.audioOutput && edge.target.parentNode.audioInput) {
        edge.source.parentNode.audioOutput.disconnect(edge.target.parentNode.audioInput);
      }
    } else if (edge.source.get("type") === "audio" && edge.target.get("automatable") === true) {
      // Disconnect audio from automatable AudioParam
      if (edge.source.parentNode.audioOutput && edge.target.parentNode.audioOutput) {
        edge.source.parentNode.audioOutput.disconnect(edge.target.parentNode.audioOutput[edge.target.id]);
      }
    }
  });

  // Log to console
  dataflow.debug = true;

  // Load test graph
  var testGraph = {"nodes":[{"id":4,"label":"audio-oscillator","type":"audio-oscillator","x":235,"y":107,"state":{"type":0,"frequency":8,"detune":0}},{"id":5,"label":"audio-gain","type":"audio-gain","x":345,"y":341,"state":{"gain":30}},{"id":3,"label":"audio-oscillator","type":"audio-oscillator","x":512,"y":107,"state":{"type":0,"frequency":400,"detune":0}},{"id":2,"label":"audio-destination","type":"audio-destination","x":778,"y":311,"state":{}},{"id":1,"label":"audio-gain","type":"audio-gain","x":791,"y":96,"state":{"gain":0.5}}],"edges":[{"source":{"node":1,"port":"out"},"target":{"node":2,"port":"in"}},{"source":{"node":3,"port":"out"},"target":{"node":1,"port":"in"}},{"source":{"node":4,"port":"out"},"target":{"node":5,"port":"in"}},{"source":{"node":5,"port":"out"},"target":{"node":3,"port":"frequency"}}]};
  var g = dataflow.loadGraph(testGraph);
  g.trigger("change");

});