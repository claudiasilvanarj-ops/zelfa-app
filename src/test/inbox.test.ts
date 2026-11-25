import { it, expect } from "vitest";
import { parseBatch, toInboxMessage } from "@/lib/inbox";
it("lê os recados do lote e ignora partes com erro", () => {
  const body = `--b\r\nContent-Type: application/http\r\n\r\nHTTP/1.1 200 OK\r\n\r\n{"id":"1","labelIds":["UNREAD"],"payload":{"headers":[{"name":"Subject","value":"Oi"}]}}\r\n--b\r\nContent-Type: application/http\r\n\r\nHTTP/1.1 404 Not Found\r\n\r\n{"error":{}}\r\n--b--`;
  const r = parseBatch("multipart/mixed; boundary=b", body).map((x) => toInboxMessage(x as never));
  expect(r).toHaveLength(1);
  expect(r[0]).toMatchObject({ subject: "Oi", unread: true });
});
