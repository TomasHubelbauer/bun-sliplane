export default function getRequestSearchParameter(
  request: Request,
  name: string
): string | null {
  const url = new URL(request.url);
  const parameter = url.searchParams.get(name);
  if (!parameter) {
    throw new Error(
      `Search parameter "${name}" is not present in the request URL`
    );
  }

  return parameter;
}
