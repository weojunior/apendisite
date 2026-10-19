// Lê os QR de uma imagem com o Vision do macOS e imprime o conteúdo.
import Foundation
import Vision

let caminho = URL(fileURLWithPath: CommandLine.arguments[1])
let pedido = VNDetectBarcodesRequest()
pedido.symbologies = [.qr]
try VNImageRequestHandler(url: caminho).perform([pedido])
for achado in pedido.results ?? [] {
    print(achado.payloadStringValue ?? "<vazio>")
}
