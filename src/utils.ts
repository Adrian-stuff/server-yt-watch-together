const data: Map<any, Map<any, any>> = new Map();
let newData: Map<any, any> = new Map();
export function setVideoData(videoID: string, room: string) {
  newData.set("videoID", videoID);
  data.set(room, newData);

  console.log("setVideoDATA:", data.get(room));
  console.log("VIDEOID PASSED!!!!", videoID);
  console.log("ROOMS PASSED!!!:", room);
  console.log("setVideoDATA(FUNCTION!!!!):", data.get(room));
  console.log("DATA(UTILS!!!!!)):", data);
}

export function setPlayStatus(room: string, status: any) {
  // data[room] = {
  //   videoID: data[room].videoID,
  //   playerStatus: { status: status.status, time: status.time },
  // };
  newData.set("playStatus", { status: status.status, time: status.time });
  console.log("setPlayStatus:", data.get(room).get("playStatus"));
}

export function getVideoData(room: string) {
  // const filteredData: any = Object.fromEntries(
  //   Object.entries(data).filter(([key, value]) => key === room)
  // );
  console.log("GetVideoData: ", data.get(room));

  return data.get(room);
}

export function isDataHas(roomID: string) {
  console.log(data.get(roomID));

  return data.get(roomID) !== undefined;
}
