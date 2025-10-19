import { expect } from "chai";
import fetch from "cross-fetch";
import { publishState } from "../utils/publishHelper.js";

const API = process.env.API_URL || "http://localhost:5000";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getDevices() {
  const res = await fetch(`${API}/api/devices`);
  return res.json();
}

describe("E2E: device control round-trip", function () {
  this.timeout(10000);
  const TEST_DEVICE_ID = "test_light_1";

  after(async () => {
    // cleanup persisted test device via admin endpoint
    try {
      await fetch(`${API}/api/admin/actuators/${TEST_DEVICE_ID}`, {
        method: "DELETE",
      });
    } catch (e) {
      /* ignore */
    }
  });

  it("POST /api/device -> MQTT set -> publish state -> GET /api/devices shows state", async () => {
    // 1) POST to API to issue a set command (this should publish to home/<type>/set)
    const payload = { deviceId: TEST_DEVICE_ID, type: "light", state: "ON" };
    const postRes = await fetch(`${API}/api/device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(postRes.ok).to.equal(true);
    const postJson = await postRes.json();
    expect(postJson).to.have.property("success");

    // 2) Simulate the real device by publishing a state message to MQTT
    await publishState({
      type: "light",
      deviceId: "test_light_1",
      state: "ON",
    });

    // 3) Poll GET /api/devices for up to 5s waiting for the device to appear
    let devices = [];
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      devices = await getDevices();
      const found = devices.find((d) => d.deviceId === "test_light_1");
      if (found) {
        expect(found.state).to.equal("ON");
        return;
      }
      await sleep(250);
    }
    // final assertion
    throw new Error(
      "device not found in /api/devices within timeout, got: " +
        JSON.stringify(devices)
    );
  });
});
