const data: any = {};

export function setVideoData(videoID: string, room: string) {
  data[room] = { videoID: videoID };
  console.log("setVideoDATA:", data[room]);
  console.log("VIDEOID PASSED!!!!", videoID);
  console.log("ROOMS PASSED!!!:", room);
  console.log("setVideoDATA(FUNCTION!!!!):", data[room]);
  console.log("DATA(UTILS!!!!!)):", data);
}

export function setPlayStatus(room: string, status: any) {
  data[room] = {
    videoID: data[room].videoID,
    playerStatus: { status: status.status, time: status.time },
  };
  console.log("setPlayStatus:", data[room]);
}

export function getVideoData(room: string) {
  const filteredData: any = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => key === room)
  );
  console.log("filteredDataGetVideoData: ", filteredData);

  return filteredData[room];
}

export function isDataHas(roomID: string) {
  return data[roomID] !== undefined;
}
